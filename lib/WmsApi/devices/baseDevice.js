const LOGGER = require('../logger.js');

class BaseWaremaDevice {
	constructor(hub, serialNumber, name, channel) {
		this.hub = hub;
		this.SN = serialNumber;
		this.name = name;
		this.channel = channel;
		LOGGER.debug('BaseWaremaDevice constructed. SN is: ' + this.SN + ', hub.webAddress is: ' + this.hub.webAddress);
	}

	getHub() {
		return this.hub;
	}

	getSerialNumber() {
		return this.SN;
	}

	getChannel() {
		return this.channel;
	}

	_setStatus(setting0 = 255, setting1 = 255, setting2 = 255, setting3 = 255) {
		throw new Error('Abstract method _setStatus must be implemented by subclasses');
	}

	_getStatus() {
		throw new Error('Abstract method _getStatus must be implemented by subclasses');
	}

	setPosition() {
		throw new Error('Abstract method setPosition must be implemented by subclasses');
	}

	getPosition() {
		throw new Error('Abstract method getPosition must be implemented by subclasses');
	}
}

class GeneralBlind extends BaseWaremaDevice {
	static _minimum_position = 0;
	static _maximum_position = 100;

	constructor(hub, serialNumber, name, channel) {
		super(hub, serialNumber, name, channel);
		LOGGER.debug('General blind constructed');
	}

	_validPosition(position) {
		if (position === undefined) return false;
		return position >= GeneralBlind._minimum_position && position <= GeneralBlind._maximum_position;
	}
}

class VenetianBlind extends GeneralBlind {
	static _minimum_position = 0;
	static _minimum_tilt = 0;
	static _maximum_position = 100;
	static _maximum_tilt = 80;

	constructor(hub, serialNumber, name, channel) {
		super(hub, serialNumber, name, channel);
	}

	_validTilt(tilt) {
		if (tilt === undefined) return false;
		return tilt >= VenetianBlind._minimum_tilt && tilt <= VenetianBlind._maximum_tilt;
	}

	setTilt(tilt) {
		throw new Error('Abstract method setTilt must be implemented by subclasses');
	}
}

module.exports = { BaseWaremaDevice, GeneralBlind, VenetianBlind };
