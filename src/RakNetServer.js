/******************************************\
 *  ____  _            ____  _         _  *
 * | __ )| |_   _  ___| __ )(_)_ __ __| | *
 * |  _ \| | | | |/ _ \  _ \| | '__/ _` | *
 * | |_) | | |_| |  __/ |_) | | | | (_| | *
 * |____/|_|\__,_|\___|____/|_|_|  \__,_| *
 *                                        *
 * This file is licensed under the GNU    *
 * General Public License 3. To use or    *
 * modify it you must accept the terms    *
 * of the license.                        *
 * ___________________________            *
 * \ @author BlueBirdMC Team /            *
\******************************************/

const BinaryStream = require("bbmc-binarystream");
const InternetAddress = require("./misc/InternetAddress");
const Identifiers = require("./Identifiers");
const Connection = require("./Connection");
const UnconnectedPing = require("./packet/UnconnectedPing");
const UnconnectedPong = require("./packet/UnconnectedPong");
const OpenConnectionRequestOne = require("./packet/OpenConnectionRequestOne");
const OpenConnectionRequestTwo = require("./packet/OpenConnectionRequestTwo");
const OpenConnectionReplyOne = require("./packet/OpenConnectionReplyOne");
const OpenConnectionReplyTwo = require("./packet/OpenConnectionReplyTwo");
const IncompatibleProtocolVersion = require("./packet/IncompatibleProtocolVersion");
const DatagramHeader = require("./misc/DatagramHeader");
const Packet = require("./packet/Packet");
const dgram = require("dgram");
const EventEmitter = require('events');
const Acknowledge = require("./packet/Acknowledge");
const Datagram = require("./packet/Datagram");

class RakNetServer extends EventEmitter {
	message;
	socket;
	protocolVersion;
	serverGUID;
	epoch;
	connections;
	isRunning;
	tickTask;

	/**
	 * Initializes the server
	 * @param {InternetAddress} address 
	 * @param {number} protocolVersion
	 */
	constructor(address, protocolVersion) {
		super();
		this.message = "";
		this.protocolVersion = protocolVersion;
		this.serverGUID = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
		this.epoch = BigInt(Date.now());
		this.isRunning = true;
		this.connections = {};
		this.socket = dgram.createSocket(address.version === 4 ? "udp4" : "udp6");
		this.socket.on('message', (msg, rinfo) => {
			if (!this.isRunning) {
				return;
			}
			this.handlePacket(new BinaryStream(msg), new InternetAddress(rinfo.address, rinfo.port, rinfo.family == "IPv4" ? 4 : 6));
		});
		this.socket.bind(address.port, address.name);
		this.tickTask = setInterval(() => {
			if (this.isRunning) {
				let connections = Object.values(this.connections);
				for (let i = 0; i < connections.length; ++i) {
					connections[i].tick();
				}
			}
		}, 10);
	}

	/**
	 * Adds a new connection to the server
	 * @param {InternetAddress} address 
	 * @param {number} mtuSize 
	 */
	addConnection(address, mtuSize) {
		if (!(address.toString() in this.connections)) {
			this.connections[address.toString()] = new Connection(address, mtuSize, this);
		}
	}

	/**
	 * Removes a connection from the server
	 * @param {InternetAddress} address 
	 */
	removeConnection(address) {
		if (address.toString() in this.connections) {
			delete this.connections[address.toString()];
		}
	}

	/**
	 * Gets an existing connection from the server
	 * @param {InternetAddress} address 
	 * @returns 
	 */
	getConnection(address) {
		if (address.toString() in this.connections) {
			return this.connections[address.toString()];
		}
	}

	/**
	 * Checks is a connection exists in the server
	 * @param {InternetAddress} address 
	 * @returns 
	 */
	hasConnection(address) {
		return (address.toString() in this.connections);
	}

	/**
	 * Get how many milliseconds past since the server started
	 */
	getTime() {
		return BigInt(Date.now()) - this.epoch;
	}

	/**
	 * Sends a packet over the network
	 * @param {Packet} packet
	 * @param {InternetAddress} address
	 */
	sendPacket(packet, address) {
		if (packet instanceof Packet) {
			if (packet.isEncoded === false) {
				packet.encode();
			}
			this.socket.send(packet.buffer.slice(0, packet.length), address.port, address.name);
		}
	}

	/**
	 * Handles incoming packets
	 * @param {BinaryStream} stream 
	 * @param {InternetAddress} address 
	 */
	handlePacket(stream, address) {
		let packetID = stream.readUnsignedByte();
		if (packetID == Identifiers.UNCONNECTED_PING) {
			let packet = new UnconnectedPing(stream.buffer);
			packet.decode();
			let newPacket = new UnconnectedPong();
			newPacket.clientTimestamp = packet.clientTimestamp;
			newPacket.serverGUID = this.serverGUID;
			newPacket.data = this.message;
			this.sendPacket(newPacket, address);
		} else if (packetID == Identifiers.OPEN_CONNECTION_REQUEST_ONE) {
			let packet = new OpenConnectionRequestOne(stream.buffer);
			packet.decode();
			if (packet.protocolVersion === this.protocolVersion) {
				let newPacket = new OpenConnectionReplyOne();
				newPacket.serverGUID = this.serverGUID;
				newPacket.useSecurity = false;
				newPacket.mtuSize = packet.mtuSize;
				this.sendPacket(newPacket, address);
			} else {
				let newPacket = new IncompatibleProtocolVersion();
				newPacket.protocolVersion = this.protocolVersion;
				newPacket.serverGUID = this.serverGUID;
				this.sendPacket(newPacket, address);
			}
		} else if (packetID == Identifiers.OPEN_CONNECTION_REQUEST_TWO) {
			let packet = new OpenConnectionRequestTwo(stream.buffer);
			packet.decode();
			let newPacket = new OpenConnectionReplyTwo();
			newPacket.serverGUID = this.serverGUID;
			newPacket.clientAddress = address;
			newPacket.mtuSize = packet.mtuSize;
			newPacket.useEncryption = false;
			this.sendPacket(newPacket, address);
			this.addConnection(address, packet.mtuSize, this);
		} else if (this.hasConnection(address) === true) {
			let connection = this.getConnection(address);

			connection.lastReceiveTimestamp = Date.now();

			let datagramHeader = new DatagramHeader(stream.buffer);
			datagramHeader.decode();

			if (!datagramHeader.isValid) {
				return;
			}

			let packet;

			if (datagramHeader.isAck || datagramHeader.isNack) {
				packet = new Acknowledge(stream.buffer, datagramHeader.readerOffset);
			} else {
				packet = new Datagram(stream.buffer, datagramHeader.readerOffset);
			}

			packet.decode();

			if (packet instanceof Acknowledge) {
				if (datagramHeader.isAck) {
					connection.handleAck(packet);
				} else if (datagramHeader.isNack) {
					connection.handleNack(packet);
				}

			} else if (packet instanceof Datagram) {
				connection.handleDatagram(packet);
			}
		}
	}

	shutdown() {
		if (!this.isRunning) return;

		this.isRunning = false;

		this.socket.close(() => {
			console.log('Server socket closed.');
		});

		if (this.tickTask) {
			clearInterval(this.tickTask);
		}

		let connections = Object.values(this.connections);
		for (let connection of connections) {
			connection.close();
		}

		this.connections = {};
	}

}

module.exports = RakNetServer;
