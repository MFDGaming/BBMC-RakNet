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

const BinaryStream = require("bbmc-binarystream");
const ReliabilityTool = require("./ReliabilityTool");

class Frame extends BinaryStream {
	reliability;
	isFragmented;
	reliableFrameIndex;
	sequencedFrameIndex;
	orderedFrameIndex;
	orderChannel;
	compoundSize;
	compoundID;
	compoundEntryIndex;
	stream;

	/**
	 * Reads the frame from the buffer
	 */
	decode() {
		let flags = this.readUnsignedByte();
		this.reliability = (flags & 0xe0) >> 5;
		this.isFragmented = (flags & 0x10) > 0;
		let streamSize = this.readUnsignedShortBE() >> 3;
		if (ReliabilityTool.isReliable(this.reliability) === true) {
			this.reliableFrameIndex = this.readUnsignedTriadLE();
		}
		if (ReliabilityTool.isSequenced(this.reliability) === true) {
			this.sequencedFrameIndex = this.readUnsignedTriadLE();
		}
		if (ReliabilityTool.isOrdered(this.reliability) === true) {
			this.orderedFrameIndex = this.readUnsignedTriadLE();
			this.orderChannel = this.readUnsignedByte();
		}
		if (this.isFragmented === true) {
			this.compoundSize = this.readUnsignedIntBE();
			this.compoundID = this.readUnsignedShortBE();
			this.compoundEntryIndex = this.readUnsignedIntBE();
		}
		this.stream = new BinaryStream(this.read(streamSize));
	}

	/**
	 * Writes the frame to the buffer
	 */
	encode() {
		this.writeUnsignedByte((this.reliability << 5) | (this.isFragmented === true ? 0x10 : 0x00));
		this.writeUnsignedShortBE(this.stream.buffer.length << 3);
		if (ReliabilityTool.isReliable(this.reliability) === true) {
			this.writeUnsignedTriadLE(this.reliableFrameIndex);
		}
		if (ReliabilityTool.isSequenced(this.reliability) === true) {
			this.writeUnsignedTriadLE(this.sequencedFrameIndex);
		}
		if (ReliabilityTool.isOrdered(this.reliability) === true) {
			this.writeUnsignedTriadLE(this.orderedFrameIndex);
			this.writeUnsignedByte(this.orderChannel);
		}
		if (this.isFragmented === true) {
			this.writeUnsignedIntBE(this.compoundSize);
			this.writeUnsignedShortBE(this.compoundID);
			this.writeUnsignedIntBE(this.compoundEntryIndex);
		}
		this.write(this.stream.buffer);
	}

	/**
	 * Gets the size of the frame
	 * @returns number
	 */
	getSize() {
		let size = 3 + this.stream.buffer.length;
		if (ReliabilityTool.isReliable(this.reliability) === true) {
			size += 3;
		}
		if (ReliabilityTool.isSequenced(this.reliability) === true) {
			size += 3;
		}
		if (ReliabilityTool.isOrdered(this.reliability) === true) {
			size += 4;
		}
		if (this.isFragmented === true) {
			size += 10;
		}
		return size;
	}
}

module.exports = Frame;
