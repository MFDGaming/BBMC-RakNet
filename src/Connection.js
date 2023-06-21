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
const Frame = require("./misc/Frame");
const FrameSet = require("./packet/FrameSet");
const Ack = require("./packet/Ack");
const Nack = require("./packet/Nack");
const ConnectionRequest = require("./packet/ConnectionRequest");
const ConnectionRequestAccepted = require("./packet/ConnectionRequestAccepted");
const NewIncomingConnection = require("./packet/NewIncomingConnection");
const ConnectedPing = require("./packet/ConnectedPing");
const ConnectedPong = require("./packet/ConnectedPong");
const Identifiers = require("./Identifiers");
const Packet = require("./packet/Packet");
const ReliabilityTool = require("./misc/ReliabilityTool");
const DisconnectNotification = require("./packet/DisconnectNotification");

class Connection {
	address;
	mtuSize;
	ackQueue;
	nackQueue;
	senderSequenceNumber;
	receiverSequenceNumber;
	senderReliableFrameIndex;
	receiverReliableFrameIndex;
	senderSequenceChannels;
	senderOrderChannels;
	senderCompoundID;
	queue;
	frameHolder;
	recoveryQueue;
	lastReceiveTimestamp;
	isConnected;
	server;

	/**
	 * Initializes a new connection
	 * @param {InternetAddress} address 
	 * @param {number} mtuSize 
	 * @param {RakNetServer} server
	 */
	constructor(address, mtuSize, server) {
		this.address = address;
		this.mtuSize = mtuSize;
		this.ackQueue = [];
		this.nackQueue = [];
		this.senderSequenceNumber = 0;
		this.receiverSequenceNumber = 0;
		this.senderReliableFrameIndex = 0;
		this.receiverReliableFrameIndex = 0;
		this.senderSequenceChannels = [];
		this.senderOrderChannels = [];
		for (let i = 0; i < 32; ++i) {
			this.senderSequenceChannels.push(0);
			this.senderOrderChannels.push(0);
		}
		this.senderCompoundID = 0;
		this.queue = [];
		this.frameHolder = {};
		this.recoveryQueue = {};
		this.lastReceiveTimestamp = Date.now();
		this.isConnected = false;
		this.server = server;
	}
	
	/**
	 * Sends a packet over the network
	 * @param {Packet} packet
	 */
	sendPacket(packet) {
		this.server.sendPacket(packet, this.address);
	}
	
	/**
	 * Sends the ack queue
	 */
	sendAckQueue() {
		if (this.ackQueue.length > 0) {
			let ack = new Ack();
			ack.sequenceNumbers = this.ackQueue;
			this.sendPacket(ack);
			this.ackQueue = [];
		}
	}
	
	/**
	 * Sends the nack queue
	 */
	sendNackQueue() {
		if (this.nackQueue.length > 0) {
			let nack = new Nack();
			nack.sequenceNumbers = this.nackQueue;
			this.sendPacket(nack);
			this.nackQueue = [];
		}
	}
	
	/**
	 * Sends all the frames in the queue
	 */
	sendQueue() {
		if (this.queue.length > 0) {
			let frameSet = new FrameSet();
			frameSet.frames = this.queue;
			frameSet.sequenceNumber = this.senderSequenceNumber;
            frameSet.sendTime = Date.now();
			this.recoveryQueue[this.senderSequenceNumber] = frameSet;
			++this.senderSequenceNumber;
			this.sendPacket(frameSet);
			this.queue = [];
		}
	}
	
	/**
	 * Appends a single frame to the queue
	 * @param {Frame} frame
	 * @param {boolean} isImmediate
	 */
	appendFrame(frame, isImmediate) {
		let size = 4 + frame.getSize();
		for (let i = 0; i < this.queue.length; ++i) {
			size += this.queue[i].getSize();
		}
		if (size > (this.mtuSize - 36)) {
			this.sendQueue();
		}
		this.queue.push(frame);
		if (isImmediate === true) {
			this.sendQueue();
		}
	}
	
	/**
	 * Adds a frame  with arbitrary size to the queue
	 * @param {Frame} frame
	 */
	addToQueue(frame) {
		if (ReliabilityTool.isSequenced(frame.reliability) === true) {
			frame.orderedFrameIndex = this.senderOrderChannels[frame.orderChannel];
			frame.sequencedFrameIndex = this.senderSequenceChannels[frame.orderChannel];
			++this.senderSequenceChannels[frame.orderChannel];
		} else if (ReliabilityTool.isOrdered(frame.reliability) === true) {
			frame.orderedFrameIndex = this.senderOrderChannels[frame.orderChannel];
			++this.senderOrderChannels[frame.orderChannel];
		}
		let maxSize = this.mtuSize - 60;
		frame.stream.rewind();
		if (frame.stream.length > maxSize) {
			let compoundSize = Math.ceil(frame.stream.length / maxSize);
			if (this.senderCompoundID > 0xffff) {
				this.senderCompoundID = 0;
			}
			for (let i = 0; i < compoundSize; ++i) {
				let compoundEntry = new Frame();
				compoundEntry.isFragmented = true;
				compoundEntry.reliability = frame.reliability;
				compoundEntry.compoundSize = compoundSize;
				compoundEntry.compoundID = this.senderCompoundID;
				compoundEntry.compoundEntryIndex = i;
				compoundEntry.stream = new BinaryStream(frame.stream.read(maxSize));
				if (ReliabilityTool.isReliable(frame.reliability) === true) {
					compoundEntry.reliableFrameIndex = this.senderReliableFrameIndex;
					++this.senderReliableFrameIndex;
				}
				if (ReliabilityTool.isOrdered(frame.reliability) === true) {
					compoundEntry.orderedFrameIndex = frame.orderedFrameIndex;
					compoundEntry.orderChannel = frame.orderChannel;
				}
				if (ReliabilityTool.isSequenced(frame.reliability) === true) {
					compoundEntry.sequencedFrameIndex = frame.sequencedFrameIndex;
				}
				this.appendFrame(compoundEntry, true);
			}
			++this.senderCompoundID;
		} else {
			if (ReliabilityTool.isReliable(frame.reliability) === true) {
				frame.reliableFrameIndex = this.senderReliableFrameIndex;
				++this.senderReliableFrameIndex;
			}
			this.appendFrame(frame, false);
		}
	}
	
	/**
	 * Disconnects the connection
	 * @param {string} reason
	 */
	disconnect(reason) {
		let frame = new Frame();
		frame.reliability = ReliabilityTool.UNRELIABLE;
		frame.isFragmented = false;
		let packet = new DisconnectNotification();
		packet.encode();
		frame.stream = new BinaryStream();
		frame.stream.buffer = packet.buffer;
		this.appendFrame(frame, true);
		this.server.removeConnection(this.address);
		this.server.emit("disconnect", this.address);
	}
	
	/**
	 * Ticks the connection
	 */
	tick() {
		if ((Date.now() - this.lastReceiveTimestamp) >= 10000) {
			this.disconnect("timeout");
		}
		this.sendAckQueue();
		this.sendNackQueue();
		this.sendQueue();
        for (const [sequenceNumber, frameSet] of Object.entries(this.recoveryQueue)) {
            if (frameSet.sendTime < (Date.now() - 8000)) {
                frameSet.sequenceNumber = this.senderSequenceNumber++;
                frameSet.sendTime = Date.now();
			    this.sendPacket(frameSet);
            }
        }
	}

	/**
	 * Handle a frame set
	 * @param {FrameSet} packet 
	 */
	handleFrameSet(packet) {
		if (this.nackQueue.includes(packet.sequenceNumber) === true) {
			this.nackQueue.splice(this.nackQueue.indexOf(packet.sequenceNumber), 1);
		}
		if (this.ackQueue.includes(packet.sequenceNumber) === false) {
			this.ackQueue.push(packet.sequenceNumber);
		}
		let holeSize = packet.sequenceNumber - this.receiverSequenceNumber;
		if (holeSize !== 0) {
			for (let sequenceNumber = this.receiverSequenceNumber + 1; sequenceNumber < packet.sequenceNumber; ++sequenceNumber) {
				if (this.nackQueue.includes(sequenceNumber) === false) {
					this.nackQueue.push(sequenceNumber);
				}
			}
		}
		this.receiverSequenceNumber = packet.sequenceNumber + 1;
		for (let i = 0; i < packet.frames.length; ++i) {
			this.handleFrame(packet.frames[i]);
		}
	}
	
	/**
	 * Handles a fragmented frame
	 * @param {Frame} frame
	 */
	handleFragmentedFrame(frame) {
		if (!(frame.compoundID in this.frameHolder)) {
			this.frameHolder[frame.compoundID] = {};
		}
		this.frameHolder[frame.compoundID][frame.compoundEntryIndex] = frame;
		if (Object.values(this.frameHolder[frame.compoundID]).length == frame.compoundSize) {
			let amalgamatedFrame = new Frame();
			amalgamatedFrame.isFragmented = false;
			amalgamatedFrame.reliability = frame.reliability;
			amalgamatedFrame.sequencedFrameIndex = frame.sequencedFrameIndex;
			amalgamatedFrame.orderedFrameIndex = frame.orderedFrameIndex;
			amalgamatedFrame.orderChannel = frame.orderChannel;
			amalgamatedFrame.stream = new BinaryStream();
			for (let i = 0; i < frame.compoundSize; ++i) {
				let frame = this.frameHolder[frame.compoundID][i];
				amalgamatedFrame.stream.write(frame.stream.buffer, frame.stream.length);
			}
			delete this.frameHolder[frame.compoundID];
			this.handleFrame(amalgamatedFrame);
		}
	}
	
	/**
	 * Handles a frame
	 * @param {Frame} frame
	 */
	handleFrame(frame) {
		if (frame.isFragmented === true) {
			this.handleFragmentedFrame(frame);
		} else {
			let packetID = frame.stream.readUnsignedByte();
			if (this.isConnected === false) {
				if (packetID == Identifiers.CONNECTION_REQUEST) {
					let packet = new ConnectionRequest(frame.stream.buffer);
					packet.decode();
					let newPacket = new ConnectionRequestAccepted();
					newPacket.clientAddress = this.address;
					newPacket.systemIndex = 0;
					newPacket.systemAddresses = [];
					for (let i = 0; i < 20; ++i) {
						newPacket.systemAddresses.push(new InternetAddress("255.255.255.255", 19132, 4));
					}
					newPacket.requestTimestamp = packet.requestTimestamp;
					newPacket.replyTimestamp = this.server.getTime();
					newPacket.encode();
					let newFrame = new Frame();
					newFrame.reliability = ReliabilityTool.UNRELIABLE;
					newFrame.isFragmented = false;
					newFrame.stream = new BinaryStream(newPacket.buffer);
					this.appendFrame(newFrame, true);
				} else if (packetID == Identifiers.NEW_INCOMING_CONNECTION) {
					let packet = new NewIncomingConnection(frame.stream.buffer);
					packet.decode();
					if (packet.serverAddress.port === this.server.socket.address().port) {
						this.isConnected = true;
						this.server.emit("connect", this);
					}
				}
			} else if (packetID == Identifiers.DISCONNECT_NOTIFICATION) {
				this.disconnect("client disconnect");
			} else if (packetID == Identifiers.CONNECTED_PING) {
				let packet = new ConnectedPing(frame.stream.buffer);
				packet.decode();
				let newPacket = new ConnectedPong();
				newPacket.clientTimestamp = packet.clientTimestamp;
				newPacket.serverTimestamp = this.server.getTime();
				newPacket.encode();
				let newFrame = new Frame();
				newFrame.reliability = ReliabilityTool.UNRELIABLE;
				newFrame.isFragmented = false;
				newFrame.stream = new BinaryStream(newPacket.buffer);
				this.appendFrame(newFrame, true);
			} else {
				frame.stream.readOffset = 0;
				this.server.emit("packet", frame.stream, this);
			}
		}
	}
	
	/**
	 * Handle an ack
	 * @param {Ack} packet
	 */
	handleAck(packet) {
		for (let i = 0; i < packet.sequenceNumbers.length; ++i) {
			if (packet.sequenceNumbers[i] in this.recoveryQueue) {
				delete this.recoveryQueue[packet.sequenceNumbers[i]];
				break;
			}
		}
	}
	
	/**
	 * Handle an nack
	 * @param {Nack} packet
	 */
	handleNack(packet) {
		for (let i = 0; i < packet.sequenceNumbers.length; ++i) {
			if (packet.sequenceNumbers[i] in this.recoveryQueue) {
				let frameSet = this.recoveryQueue[packet.sequenceNumbers[i]];
				frameSet.sequenceNumber = this.senderSequenceNumber;
				this.recoveryQueue[this.senderSequenceNumber] = frameSet;
				++this.senderSequenceNumber;
				this.sendPacket(frameSet);
				delete this.recoveryQueue[packet.sequenceNumbers[i]];
				break;
			}
		}
	}
}

module.exports = Connection;
