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

class IncompatibleProtocolVersion extends Packet {
	packetID = Identifiers.INCOMPATIBLE_PROTOCOL_VERSION;
	protocolVersion;
	serverGUID;

	decodeBody() {
		this.protocolVersion = this.readUnsignedShortBE();
		this.readMagic();
		this.serverGUID = this.readUnsignedLongBE();
	}

	encodeBody() {
		this.writeUnsignedShortBE(this.protocolVersion);
		this.writeMagic();
		this.writeUnsignedLongBE(this.serverGUID);
	}
}

module.exports = IncompatibleProtocolVersion;
