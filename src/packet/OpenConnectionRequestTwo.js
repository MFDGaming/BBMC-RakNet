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

class OpenConnectionRequestTwo extends Packet {
	packetID = Identifiers.OPEN_CONNECTION_REQUEST_TWO;
	serverAddress;
	mtuSize;
	clientGUID;

	decodeBody() {
		this.readMagic();
		this.serverAddress = this.readAddress();
		this.mtuSize = this.readUnsignedShortBE();
		this.clientGUID = this.readUnsignedLongBE();
	}

	encodeBody() {
		this.writeMagic();
		this.writeAddress(this.serverAddress);
		this.writeUnsignedShortBE(this.mtuSize);
		this.writeUnsignedLongBE(this.clientGUID);
	}
}

module.exports = OpenConnectionRequestTwo;