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

class ReliabilityTool {
	static UNRELIABLE = 0x00;
	static UNRELIABLE_SEQUENCED = 0x01;
	static RELIABLE = 0x02;
	static RELIABLE_ORDERED = 0x03;
	static RELIABLE_SEQUENCED = 0x04;
	static UNRELIABLE_WITH_ACK_RECEIPT = 0x05;
	static RELIABLE_WITH_ACK_RECEIPT = 0x06;
	static RELIABLE_ORDERED_WITH_ACK_RECEIPT = 0x07;

	/**
	 * Checks if is reliable
	 * @param {number} reliability 
	 * @returns boolean
	 */
	static isReliable(reliability) {
		if (reliability === ReliabilityTool.RELIABLE || reliability === ReliabilityTool.RELIABLE_ORDERED || reliability === ReliabilityTool.RELIABLE_SEQUENCED || reliability === ReliabilityTool.RELIABLE_WITH_ACK_RECEIPT || reliability === ReliabilityTool.RELIABLE_ORDERED_WITH_ACK_RECEIPT) {
			return true;
		}
		return false;
	}

	/**
	 * Checks if is sequenced
	 * @param {number} reliability 
	 * @returns boolean
	 */
	static isSequenced(reliability) {
		if (reliability === ReliabilityTool.UNRELIABLE_SEQUENCED || reliability === ReliabilityTool.RELIABLE_SEQUENCED) {
			return true;
		}
		return false;
	}

	/**
	 * Checks if is ordered
	 * @param {number} reliability 
	 * @returns boolean
	 */
	static isOrdered(reliability) {
		if (reliability === ReliabilityTool.UNRELIABLE_SEQUENCED || reliability === ReliabilityTool.RELIABLE_ORDERED || reliability === ReliabilityTool.RELIABLE_SEQUENCED || reliability === ReliabilityTool.RELIABLE_ORDERED_WITH_ACK_RECEIPT) {
			return true;
		}
		return false;
	}
}

module.exports = ReliabilityTool;
