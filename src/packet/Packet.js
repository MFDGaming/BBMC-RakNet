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
const InternetAddress = require("../misc/InternetAddress");
const Identifiers = require("../Identifiers");
const {ntop, pton} = require('js-inet');

class Packet extends BinaryStream {
	packetID = -1;
	isEncoded = false;

	/**
	 * Reads the packet's ID from the buffer and checks if it's valid
	 */
	decodeHeader() {
		if (this.readUnsignedByte() !== this.packetID) {
			throw new Error("Invalid packet id");
		}
	}

	/**
	 * Reads the packet's body from the buffer
	 */
	decodeBody() {
		// Template
	}

	/**
	 * Reads the entire packet from the buffer
	 */
	decode() {
		this.decodeHeader();
		this.decodeBody();
	}

	/**
	 * Writes the packet's ID
	 */
	encodeHeader() {
		this.writeUnsignedByte(this.packetID);
	}

	/**
	 * Writes the packet's body to the buffer
	 */
	encodeBody() {
		// Template
	}

	/**
	 * Writes the entire packet to the buffer
	 */
	encode() {
		this.isEncoded = true;
		this.encodeHeader();
		this.encodeBody();
	}

	/**
	 * Gets a utf8 string from buffer
	 * @returns string
	 */
	readString() {
		return this.read(this.readShortBE()).toString('utf8');
	}

	/**
	 * Writes a utf8 string to the buffer
	 * @param {string} value 
	 */
	writeString(value) {
		this.writeShortBE(value.length);
		this.write(Buffer.from(value, 'utf8'));
	}

	/**
	 * Reads an internet address from the buffer
	 * @returns InternetAddress
	 */
	readAddress() {
		let version = this.readUnsignedByte();
		if (version === 4) {
			let name = (~this.readUnsignedByte() & 0xff).toString();
			name += ".";
			name += (~this.readUnsignedByte() & 0xff).toString();
			name += ".";
			name += (~this.readUnsignedByte() & 0xff).toString();
			name += ".";
			name += (~this.readUnsignedByte() & 0xff).toString();
			let port = this.readUnsignedShortBE();
			return new InternetAddress(name, port, version);
		} else if (version == 6) {
			this.readUnsignedShortLE();
			let port = this.readUnsignedShortBE();
			this.readUnsignedIntBE();
			let name = ntop(this.read(16));
			this.readUnsignedIntBE();
			return new InternetAddress(name, port, version);
		} else {
			throw new Error("Invalid address version");
		}
	}

	/**
	 * Writes a internet address to the buffer
	 * @param {InternetAddress} value
	 */
	writeAddress(value) {
		if (value.version == 4) {
			this.writeUnsignedByte(value.version);
			let parts = value.name.split(".");
			this.writeUnsignedByte(~Number(parts[0]) & 0xff);
			this.writeUnsignedByte(~Number(parts[1]) & 0xff);
			this.writeUnsignedByte(~Number(parts[2]) & 0xff);
			this.writeUnsignedByte(~Number(parts[3]) & 0xff);
			this.writeUnsignedShortBE(value.port);
		} else if (value.version == 6) {
			this.writeUnsignedByte(value.version);
			this.writeUnsignedShortLE(10);
			this.writeUnsignedShortBE(value.port);
			this.writeIntBE(0);
			this.write(pton(value.name));
			this.writeIntBE(0);
		} else {
			throw new Error("Invalid address version");
		}
	}

	/**
	 * Reads a magic identifier from the buffer and check if it's valid
	 */
	readMagic() {
		if (Buffer.compare(this.read(16), Identifiers.MAGIC) === false) {
			throw new Error("Invalid magic");
		}
	}

	/**
	 * Writes a magic identifier to the buffer
	 */
	writeMagic() {
		this.write(Identifiers.MAGIC);
	}
}

module.exports = Packet;
