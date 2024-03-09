const { Buffer } = require('buffer');
const { decode } = require('./shrouding.js');
//const { BaseWaremaDevice, GeneralBlind, VenetianBlind } = require('./devices/baseDevice.js');
const { AsyncGeneralBlind, AsyncVenetianBlind } = require('./devices/AsyncDevices.js');

const LOGGER = require('./logger.js');

function genericPostMessage(action = '', parameters = {}) {
	const data = { action, parameters };
	data.changeIds = [];
	return JSON.stringify(data);
}

class BaseHub {
	constructor(webAddress, ipPort = 80) {
		this.webAddress = ipPort === 80 ? `http://${webAddress}` : `http://${webAddress}:${ipPort}`;
		this.devices = {};
		this.status = {};
	}

	getDeviceFromSerialNumber(serialNumber) {
		return this.devices[serialNumber];
	}

	getDeviceFromIndex(index) {
		return Array.from(this.devices.values())[index];
	}

	_processReceiverBlock(data, sync = true) {
		for (let i = 0; i < data.length / 64; i++) {
			const device = data.slice(i * 64, (i + 1) * 64);
			const buf = Buffer.from(device.slice(0, 4));
			const elementSerial = buf.readInt32LE();

			if (elementSerial === 0) continue;

			const elementName = device.slice(24).toString('latin1').trim('\x00');

			LOGGER.debug(`Found Device: ${elementSerial} / ${elementName}`);

			const cls = sync
				? elementName.startsWith('Raffstore')
					? AsyncVenetianBlind
					: AsyncGeneralBlind
				: elementName.startsWith('Raffstore')
					? AsyncVenetianBlind
					: AsyncGeneralBlind;

			this.devices[elementSerial] = new cls(this, elementSerial, elementName, i);
		}

		return this.devices;
	}

	_channelCommandRequest(ch, fn, s0, s1, s2, s3) {
		return genericPostMessage('channelCommandRequest', {
			channel: ch,
			functionCode: fn,
			setting0: s0,
			setting1: s1,
			setting2: s2,
			setting3: s3,
		});
	}

	_manualCommandRequest(sn) {
		return genericPostMessage('manualCommandRequest', {
			serialNumber: sn,
			functionCode: 0,
		});
	}

	_mb8Read(block, adr, eui, length) {
		return genericPostMessage('mb8Read', {
			address: adr,
			block: block,
			eui: eui,
			length: length,
		});
	}

	_processResponse(response) {
		//LOGGER.debug("_processRespons raw: "+ response);
		const decodedResponse = decode(response).toString();
		//LOGGER.debug("_processResponse decoded: "+ decodedResponse);
		const jsonResponse = JSON.parse(decodedResponse);
		//LOGGER.debug("_processResponse as JSON: "+ JSON.stringify(jsonResponse));
		return jsonResponse.response ?? jsonResponse;
	}
}

module.exports = BaseHub;
