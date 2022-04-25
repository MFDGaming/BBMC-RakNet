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

class InternetAddress {
	name;
	port;
	version;

	/**
	 * Initialzes a new internet address
	 * @param {string} name 
	 * @param {number} port 
	 * @param {number} version 
	 */
	constructor (name, port, version = 4) {
		this.name = name;
		this.port = port;
		this.version = version;
	}

	/**
	 * Converts the address to a string
	 * @returns string
	 */
	toString() {
		return this.name + ":" + this.port.toString();
	}
}

module.exports = InternetAddress;