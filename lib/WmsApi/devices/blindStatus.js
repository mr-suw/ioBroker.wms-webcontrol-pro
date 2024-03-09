const LOGGER = require('../logger.js');

class GeneralBlindStatus {
	constructor(setting0, setting1, setting2, setting3) {
		this.setting0 = setting0;
		this.setting1 = setting1;
		this.setting2 = setting2;
		this.setting3 = setting3;
		LOGGER.debug(
			'GeneralBlindStatus constructed. Settings: ' +
				this.setting0 +
				', ' +
				this.setting1 +
				', ' +
				this.setting2 +
				', ' +
				this.setting3,
		);
	}

	static create(setting0, setting1, setting2, setting3) {
		return new GeneralBlindStatus(setting0 / 2, setting1 - 127, setting2, setting3);
	}
}

class VenetianBlindStatus {
	constructor(position, tilt) {
		this.position = position;
		this.tilt = tilt;
	}

	static create(position, tilt) {
		return new VenetianBlindStatus(position / 2, tilt - 127);
	}
}

module.exports = { GeneralBlindStatus, VenetianBlindStatus };
