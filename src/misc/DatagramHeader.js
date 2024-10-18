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

const Identifiers = require("../Identifiers");
const BinaryStream = require("bbmc-binarystream");

class DatagramHeader extends BinaryStream {
	isValid = true;
	isAck = false;
	isNack = false;

	decode() {
		let byte = this.readUnsignedByte();
		this.isValid = (byte & Identifiers.DATAGRAM_FLAGS.VALID.VALUE) !== 0;
		this.isAck = (byte & Identifiers.DATAGRAM_FLAGS.ACK.VALUE) !== 0;
		this.isNack = (byte & Identifiers.DATAGRAM_FLAGS.NACK) !== 0;
	}

	encode() {
		if (!this.isValid) {
			throw new Error("Datagram must be valid");
		}

		let byte = Identifiers.DATAGRAM_FLAGS.VALID.VALUE;
		byte |= this.isAck ? Identifiers.DATAGRAM_FLAGS.ACK.VALUE : 0x00;
		byte |= this.isNack ? Identifiers.DATAGRAM_FLAGS.NACK : 0x00;
		this.writeUnsignedByte(byte);
	}
}

module.exports = DatagramHeader;
