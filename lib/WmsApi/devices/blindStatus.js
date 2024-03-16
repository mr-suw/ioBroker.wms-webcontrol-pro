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

	getSetting0Calc() {
		return Math.round(this.setting0 / 2);
	}

	getSetting1Calc() {
		return this.setting1 - 127;
	}

	getSetting2Calc() {
		return this.setting2;
	}

	getSetting3Calc() {
		return this.setting3;
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

	getPositionCalc() {
		return Math.round(this.position / 2);
	}

	getTiltCalc() {
		return this.tilt - 127;
	}

	static create(position, tilt) {
		return new VenetianBlindStatus(position / 2, tilt - 127);
	}
}

module.exports = { GeneralBlindStatus, VenetianBlindStatus };
