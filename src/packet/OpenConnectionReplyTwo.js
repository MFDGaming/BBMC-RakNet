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

const Packet = require("./Packet");
const Identifiers = require("../Identifiers");

class OpenConnectionReplyTwo extends Packet {
	packetID = Identifiers.OPEN_CONNECTION_REPLY_TWO;
	serverGUID;
	clientAddress;
	mtuSize;
	useEncryption;

	decodeBody() {
		this.readMagic();
		this.serverGUID = this.readUnsignedLongBE();
		this.clientAddress = this.readAddress();
		this.mtuSize = this.readUnsignedShortBE();
		this.useEncryption = this.readBool();
	}

	encodeBody() {
		this.writeMagic();
		this.writeUnsignedLongBE(this.serverGUID);
		this.writeAddress(this.clientAddress);
		this.writeUnsignedShortBE(this.mtuSize);
		this.writeBool(this.useEncryption);
	}
}

module.exports = OpenConnectionReplyTwo;
