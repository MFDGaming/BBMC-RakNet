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
const BinaryStream = require("bbmc-binarystream");

class Acknowledge extends Packet {
	sequenceNumbers;

	decodeHeader() { }
	encodeHeader() { }

	decodeBody() {
		this.sequenceNumbers = [];
		let recordCount = this.readUnsignedShortBE();
		for (let i = 0; i < recordCount; ++i) {
			let isSingle = this.readBool();
			if (isSingle === true) {
				this.sequenceNumbers.push(this.readUnsignedTriadLE());
			} else {
				let currentIndex = this.readUnsignedTriadLE();
				let endIndex = this.readUnsignedTriadLE();
				while (currentIndex <= endIndex) {
					this.sequenceNumbers.push(currentIndex);
					++currentIndex;
				}
			}
		}
	}

	encodeBody() {
		this.sequenceNumbers.sort();
		let stream = new BinaryStream();
		let recordCount = 0;
		if (this.sequenceNumbers.length > 0) {
			let startIndex = this.sequenceNumbers[0];
			let endIndex = this.sequenceNumbers[0];
			for (let i = 1; i < this.sequenceNumbers.length; ++i) {
				let currentIndex = this.sequenceNumbers[i];
				let diff = currentIndex - endIndex;
				if (diff === 1) {
					endIndex = currentIndex;
				} else if (diff > 1) {
					if (startIndex === endIndex) {
						stream.writeUnsignedByte(0x01);
						stream.writeUnsignedTriadLE(startIndex);
						startIndex = endIndex = currentIndex;
					} else {
						stream.writeUnsignedByte(0x00);
						stream.writeUnsignedTriadLE(startIndex);
						stream.writeUnsignedTriadLE(endIndex);
						startIndex = endIndex = currentIndex;
					}
					++recordCount;
				}
			}
			if (startIndex === endIndex) {
				stream.writeUnsignedByte(0x01);
				stream.writeUnsignedTriadLE(startIndex);
			} else {
				stream.writeUnsignedByte(0x00);
				stream.writeUnsignedTriadLE(startIndex);
				stream.writeUnsignedTriadLE(endIndex);
			}
			++recordCount;
			this.writeUnsignedShortBE(recordCount);
			this.write(stream.buffer, stream.length);
		}
	}
}

module.exports = Acknowledge;
