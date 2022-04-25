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

class ConnectionRequest extends Packet {
	packetID = Identifiers.CONNECTION_REQUEST;
	clientGUID;
	requestTimestamp;

	decodeBody() {
		this.clientGUID = this.readUnsignedLongBE();
		this.requestTimestamp = this.readUnsignedLongBE();
	}

	encodeBody() {
		this.writeUnsignedLongBE(this.clientGUID);
		this.writeUnsignedLongBE(this.requestTimestamp);
	}
}

module.exports = ConnectionRequest;