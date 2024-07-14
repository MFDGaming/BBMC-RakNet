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
const Frame = require("../misc/Frame");

class FrameSet extends Packet {
	packetID = Identifiers.FRAME_SET;
	sequenceNumber;
	frames;
    sendTime;

	decodeHeader() {
		if ((this.readUnsignedByte() & this.packetID) !== this.packetID) {
			throw new Error("Invalid packet id");
		}
	}

	decodeBody() {
		this.sequenceNumber = this.readUnsignedTriadLE();
		this.frames = [];
		while (this.feos() === false) {
			let frame = new Frame(this.buffer, this.readerOffset);
			frame.decode();
			this.readerOffset = frame.readerOffset;
			this.frames.push(frame);
		}
	}

	encodeBody() {
		this.writeUnsignedTriadLE(this.sequenceNumber);
		for (let i = 0; i < this.frames.length; ++i) {
			let frame = this.frames[i];
			frame.encode();
			this.write(frame.buffer, frame.length);
		}
	}
}

module.exports = FrameSet;