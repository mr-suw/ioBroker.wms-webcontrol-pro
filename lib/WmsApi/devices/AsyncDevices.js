const { BaseWaremaDevice, GeneralBlind, VenetianBlind } = require('./baseDevice.js');
const { GeneralBlindStatus, VenetianBlindStatus } = require('./blindStatus.js');
const LOGGER = require('../logger.js');

class AsyncWaremaDevice extends BaseWaremaDevice {
	constructor(hub, serialNumber, name, channel) {
		super(hub, serialNumber, name, channel);
		LOGGER.debug('AsyncWaremaDevice constructed. Check properties hub.webAddress ' + super.getHub().webAddress);
	}

	_setStatus(command = 3, setting0 = 255, setting1 = 255, setting2 = 255, setting3 = 255) {
		return super
			.getHub()
			.channelCommandRequest(super.getChannel(), command, setting0, setting1, setting2, setting3)
			.catch((error) => {
				console.error('Error setting device status:', error);
			});
	}

	_getStatus() {
		LOGGER.debug('Check super access to property serial number: ' + super.getSerialNumber());

		return super
			.getHub()
			.mb8Read(1, 0, super.getSerialNumber(), 7)
			.then((response) => {
				const fields = response.data;
				LOGGER.debug('raw response: ' + fields + ', length:' + fields.byteLength);

				//const f0 = parseInt(fields[0].toString('latin1'));
				const f0 = fields.readUInt8(0);
				const f1 = fields.readUInt8(1);
				const f2 = fields.readUInt8(2);
				const f3 = fields.readUInt8(3);

				LOGGER.debug('integer response: ' + f0 + ', ' + f1 + ', ' + f2 + ', ' + f3);

				return [f0, f1, f2, f3];
			})
			.catch((error) => {
				console.error('Failed to get device status:', error);
				throw error; // Re-throw for further handling
			});
	}

	setStop() {
		return this._setStatus(1);
	}
}

class AsyncGeneralBlind extends AsyncWaremaDevice {
	constructor(hub, serialNumber, name, channel) {
		super(hub, serialNumber, name, channel);
		this.generalBlind = new GeneralBlind(hub, serialNumber, name, channel);
	}

	setPosition(position) {
		if (!this.generalBlind._validPosition(position)) {
			throw new Error(
				`Position must be between ${this.generalBlind._minimum_position} and ${this.generalBlind._maximum_position}`,
			);
		}

		const adjustedPosition = position * 2;
		return super._setStatus(3, adjustedPosition);
	}

	getPosition() {
		LOGGER.debug('AsyncGeneralBlind get position processing started.');
		return super._getStatus().then((data) => new GeneralBlindStatus(...data));
	}
}

class AsyncVenetianBlind extends AsyncWaremaDevice {
	constructor(hub, serialNumber, name, channel) {
		super(hub, serialNumber, name, channel);
		this.venetianBlind = new VenetianBlind(hub, serialNumber, name, channel);
	}

	setTilt(tilt) {
		if (!this.venetianBlind._validTilt(tilt)) {
			throw new Error(
				`Tilt must be between ${this.venetianBlind._minimum_tilt} and ${this.venetianBlind._maximum_tilt}`,
			);
		}

		const adjustedTilt = tilt + 127;
		return super._setStatus(3, 255, adjustedTilt);
	}

	setPosition(position, tilt) {
		if (!this.venetianBlind._validPosition(position)) {
			throw new Error(
				`Position must be between ${this.venetianBlind._minimum_position} and ${this.venetianBlind._maximum_position}`,
			);
		}

		const adjustedPosition = position * 2;

		if (!this.venetianBlind._validTilt(tilt)) {
			tilt = 255;
		}

		const adjustedTilt = tilt + 127;
		return super._setStatus(3, adjustedPosition, adjustedTilt);
	}

	getPosition() {
		LOGGER.debug('AsyncVenetianBlind get position processing started.');
		return super._getStatus().then((data) => new VenetianBlindStatus(data[0], data[1]));
	}
}

module.exports = { AsyncWaremaDevice, AsyncGeneralBlind, AsyncVenetianBlind };
