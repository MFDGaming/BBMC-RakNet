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

const Frame = require("../misc/Frame");
const Packet = require("./Packet");

class Datagram extends Packet {
	sequenceNumber;
	frames;

	decodeHeader() { }
	encodeHeader() { }

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

module.exports = Datagram;
