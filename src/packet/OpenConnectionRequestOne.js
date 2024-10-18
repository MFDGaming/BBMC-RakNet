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

class OpenConnectionRequestOne extends Packet {
	packetID = Identifiers.OPEN_CONNECTION_REQUEST_ONE;
	protocolVersion;
	mtuSize;

	decodeBody() {
		this.readMagic();
		this.protocolVersion = this.readUnsignedByte();
		this.mtuSize = this.readRemaining().length + 46;
	}

	encodeBody() {
		this.writeMagic();
		this.writeUnsignedByte(this.protocolVersion);
		let tmp = Buffer.alloc(this.mtuSize - 46);
		tmp.fill("\x00");
		this.write(tmp);
	}
}

module.exports = OpenConnectionRequestOne;
