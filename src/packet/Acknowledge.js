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

const SINGLE_PACKET_FLAG = 0x01;
const RANGE_PACKET_FLAG = 0x00;

class Acknowledge extends Packet {
    sequenceNumbers;

    decodeHeader() {}

    encodeHeader() {}

    /**
     * Decodes the body of the acknowledgment packet.
     * Reads sequence numbers, either as single entries or ranges.
     */
    decodeBody() {
        this.sequenceNumbers = [];
        let recordCount = this.readUnsignedShortBE();

        if (recordCount < 0) {
            throw new Error("Invalid record count");
        }

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

    /**
     * Encodes the body of the acknowledgment packet.
     * Compresses sequence numbers into single entries or ranges.
     */
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
                } else {
                    stream.writeUnsignedByte(startIndex === endIndex ? SINGLE_PACKET_FLAG : RANGE_PACKET_FLAG);
                    stream.writeUnsignedTriadLE(startIndex);
                    if (startIndex !== endIndex) {
                        stream.writeUnsignedTriadLE(endIndex);
                    }
                    startIndex = endIndex = currentIndex;
                    ++recordCount;
                }
            }

            stream.writeUnsignedByte(startIndex === endIndex ? SINGLE_PACKET_FLAG : RANGE_PACKET_FLAG);
            stream.writeUnsignedTriadLE(startIndex);
            if (startIndex !== endIndex) {
                stream.writeUnsignedTriadLE(endIndex);
            }
            ++recordCount;

            this.writeUnsignedShortBE(recordCount);
            this.write(stream.buffer, stream.length);
        }
    }
}

module.exports = Acknowledge;
