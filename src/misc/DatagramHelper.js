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

const Acknowledge = require("../packet/Acknowledge");
const Datagram = require("../packet/Datagram");
const DatagramHeader = require("./DatagramHeader");

class DatagramHelper {

	/**
	 * Create a new acknowledge
	 * 
	 * @param {bool} negative - specify whether it is nack else it is an ack
	 * @param {bool} forEncoding - for usage as a reader
	 * @param {Buffer} buffer
	 * @returns {Acknowledge}
	 */
	static createAcknowledge(negative = false, forEncoding = true, buffer = Buffer.allocUnsafe(0)) {
		if (buffer.length === 0 && !forEncoding) {
			throw new Error("You must put a valid buffer to create an nack or ack that will be read from");
		}

		let datagramHeader = new DatagramHeader(buffer);
		if (forEncoding) {
			datagramHeader.isAck = !negative;
			datagramHeader.isNack = negative;
			datagramHeader.encode();
		} else {
			datagramHeader.decode();
		}

		return new Acknowledge(datagramHeader.buffer, datagramHeader.readerOffset, datagramHeader.writerOffset);
	}

	/**
	 * Create a new datagram
	 * 
	 * @param {bool} forEncoding - for usage as a reader
	 * @param {Buffer} buffer
	 * @returns {Datagram}
	 */
	static createDatagram(forEncoding = true, buffer = Buffer.allocUnsafe(0)) {
		if (buffer.length === 0 && !forEncoding) {
			throw new Error("You must put a valid buffer to create a datagram that will be read from");
		}

		let datagramHeader = new DatagramHeader(buffer);
		if (forEncoding) {
			datagramHeader.encode();
		} else {
			datagramHeader.decode();
		}

		return new Datagram(datagramHeader.buffer, datagramHeader.readerOffset, datagramHeader.writerOffset);
	}
}

module.exports = DatagramHelper;
