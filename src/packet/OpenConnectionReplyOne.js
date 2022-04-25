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

class OpenConnectionReplyOne extends Packet {
	packetID = Identifiers.OPEN_CONNECTION_REPLY_ONE;
	serverGUID;
	useSecurity;
	mtuSize;

	decodeBody() {
		this.readMagic();
		this.serverGUID = this.readUnsignedLongBE();
		this.useSecurity = this.readBool();
		this.mtuSize = this.readUnsignedShortBE();
	}

	encodeBody() {
		this.writeMagic();
		this.writeUnsignedLongBE(this.serverGUID);
		this.writeBool(this.useSecurity);
		this.writeUnsignedShortBE(this.mtuSize);
	}
}

module.exports = OpenConnectionReplyOne;