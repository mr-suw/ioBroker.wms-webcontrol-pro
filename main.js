'use strict';

/*
 * Created with @iobroker/create-adapter v2.6.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const { AsyncWaremaHub } = require('./lib/WmsApi/asyncHub.js');
const { AsyncVenetianBlind } = require('./lib/WmsApi/devices/AsyncDevices.js');
const DEV_POS_STATE = {
	CLOSING: 0,
	OPENING: 1,
	STOPPED: 2,
};
const FAST_SINGLE_POLLING_TIME = 10000;

class WmsWebcontrolPro extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'wms-webcontrol-pro',
		});
		this.on('ready', this.onReady.bind(this));
		// @ts-ignore
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
		this.pollingAllDev = null;
		this.pollingTimeAllDev = 60000;
		this.pollingSingleDev = null;
		this.devices = null;
		this.isTxLock = false;
		this.hub = null;
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here
		this.checkCfg();
		this.pollingTimeAllDev = this.config.optPollTime * 1000;
		this.hub = new AsyncWaremaHub(this.config.optIp);

		this.updateConStates(true);
		this.log.info('hub device connected');

		try {
			this.devices = await this.hub.getDevices();
			this.log.debug('wms devices retrieved');
			this.updateHubStates(this.hub.getStatus());
			this.updateDevStates();
			this.schedulePollAllDevPos(this.pollingTimeAllDev);
		} catch (error) {
			this.updateConStates(false);
			this.log.error('Error: ' + error);
			this.delayRestartMs = 15 * 60 * 1000;
			this.log.info('restarting adapter in ' + this.delayRestartMs + 'ms');
			this.delay(this.delayRestartMs);
			this.restart();
		}
	}

	checkCfg() {
		if (this.config.optIp == '' || this.config.optPollTime < 3) {
			this.log.error('IP address not set or polling time below 3 seconds');
			this.disable();
		}
	}

	async createObj(pathName, name, objType, role, dataType, enableWrite, enableRead) {
		await this.setObjectNotExistsAsync(pathName, {
			type: objType,
			common: {
				name: name,
				type: dataType,
				role: role,
				read: enableRead,
				write: enableWrite,
			},
			native: {},
		});
	}

	async updateConStates(isOnline) {
		this.log.debug('updating connection info to: ' + isOnline);
		await this.createObj('info.connected', 'info.connected', 'state', 'indicator', 'boolean', false, true);
		await this.setStateAsync(this.name + '.' + this.instance + '.info.connected', isOnline, true);
	}

	async updateHubStates(hubStatus) {
		this.log.debug('creating adapter objects');
		//create states when not existing
		await this.createObj('hub.serialNumber', 'hub.serialNumber', 'state', 'number', 'number', true, false);
		await this.createObj('hub.name', 'hub.name', 'state', 'string', 'string', true, false);
		await this.createObj(
			'hub.cloudConnectionStatus',
			'hub.cloudConnectionStatus',
			'state',
			'number',
			'number',
			true,
			false,
		);
		await this.createObj(
			'hub.bootloaderVersion',
			'hub.bootloaderVersion',
			'state',
			'string',
			'string',
			true,
			false,
		);
		await this.createObj('hub.softwareVersion', 'hub.softwareVersion', 'state', 'string', 'string', true, false);
		await this.createObj('hub.bootTime', 'hub.bootTime', 'state', 'number', 'number', true, false);
		await this.createObj('hub.containerVersion', 'hub.containerVersion', 'state', 'string', 'string', true, false);
		await this.createObj('hub.hostname', 'hub.hostname', 'state', 'string', 'string', true, false);
		await this.createObj('hub.ipAddress', 'hub.ipAddress', 'state', 'string', 'string', true, false);
		await this.createObj('hub.netMask', 'hub.netMask', 'state', 'string', 'string', true, false);
		await this.createObj('hub.isRegistered', 'hub.isRegistered', 'state', 'boolean', 'boolean', true, false);
		await this.createObj('hub.time', 'hub.time', 'state', 'string', 'string', true, false);

		//update hub objects
		this.log.info('updating hub device objects');
		this.setStateAsync(this.name + '.' + this.instance + '.hub.serialNumber', hubStatus.serialNumber, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.name', hubStatus.name, true);
		this.setStateAsync(
			this.name + '.' + this.instance + '.hub.cloudConnectionStatus',
			hubStatus.cloudConnectionStatus,
			true,
		);
		this.setStateAsync(
			this.name + '.' + this.instance + '.hub.bootloaderVersion',
			hubStatus.bootloaderVersion,
			true,
		);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.softwareVersion', hubStatus.softwareVersion, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.bootTime', hubStatus.bootTime, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.containerVersion', hubStatus.containerVersion, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.hostname', hubStatus.hostname, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.ipAddress', hubStatus.ipAddress, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.netMask', hubStatus.netMask, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.isRegistered', hubStatus.isRegistered, true);
		this.setStateAsync(this.name + '.' + this.instance + '.hub.time', hubStatus.time, true);
	}

	async updateDevStates() {
		const devices = this.getDevices();

		if (devices != null) {
			this.log.debug('creating device objects');

			for (const d of Object.values(devices)) {
				await this.createObj(d.SN + '.name', d.SN + '.name', 'state', 'string', 'string', true, false);
				await this.createObj(d.SN + '.channel', d.SN + '.channel', 'state', 'number', 'number', true, false);
				await this.createObj(d.SN + '.setting0', d.SN + '.setting0', 'state', 'state', 'number', true, true);
				await this.createObj(d.SN + '.setting1', d.SN + '.setting1', 'state', 'state', 'number', true, true);
				await this.createObj(d.SN + '.setting2', d.SN + '.setting2', 'state', 'state', 'number', true, true);
				await this.createObj(d.SN + '.setting3', d.SN + '.setting3', 'state', 'state', 'number', true, true);
				await this.createObj(d.SN + '.posState', d.SN + '.posState', 'state', 'state', 'number', true, false);
				this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.name', d.name, true);
				this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.channel', d.getChannel(), true);
				this.setStateAsync(
					this.name + '.' + this.instance + '.' + d.SN + '.posState',
					DEV_POS_STATE.STOPPED,
					true,
				);

				//subscribe to states
				this.subscribeStates(d.SN + '.setting*');
			}
		}
	}

	areBlindSettingsEqual(a, b) {
		return (
			a != null &&
			b != null &&
			a.getSetting0Calc() == b.getSetting0Calc() &&
			a.getSetting1Calc() == b.getSetting1Calc() &&
			a.getSetting2Calc() == b.getSetting2Calc() &&
			a.getSetting3Calc() == b.getSetting3Calc()
		);
	}

	async pullDevPos(d) {
		const prevPos = d.getPositionFromRam();
		const pos = await d.getPosition();
		const posState = await this.getStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.posState');

		let result = 0; //0: pull and update successful; 1: device position has been stopped

		const blindSetEqual = this.areBlindSettingsEqual(prevPos, pos);

		if (posState != null && posState.val != DEV_POS_STATE.STOPPED) {
			//device motor seems running due to a position request; checking if stopped
			if (blindSetEqual == true) {
				this.log.debug('switchting to stopped state because blind cover has reached target pos');
				await this.setStateAsync(
					this.name + '.' + this.instance + '.' + d.SN + '.posState',
					DEV_POS_STATE.STOPPED,
					true,
				);

				result = 1;
			}
		}

		this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting0', pos.getSetting0Calc(), true);
		this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting1', pos.getSetting1Calc(), true);
		this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting2', pos.getSetting2Calc(), true);
		this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting3', pos.getSetting3Calc(), true);

		return result;
	}

	async pollSingleDevPos(d, intervalMs) {
		this.log.debug('single device poll - started for: ' + d.name);

		this.clearScheduleSingleDevPos();

		const resPullDev = await this.pullDevPos(d);

		if (0 == resPullDev) {
			//device updated successfully
			this.log.debug('single device poll - re-schedule: ' + intervalMs + 'ms');
			this.schedulePollSingleDevPos(d, intervalMs);
		} else if (1 == resPullDev) {
			//disable posititon state switched to stopped
			this.log.debug('single device (' + d.name + ') poll - disabled');
		}
	}

	async pollAllDevPos() {
		this.log.debug('polling of all device positions started');
		this.clearScheduleAllDevPos();

		const devices = this.getDevices();

		// request new positions when allowed
		if (this.isTxLocked() == false && devices != null) {
			let numDev = 0;
			let getPosErrCnt = 0;

			for (const d of Object.values(devices)) {
				try {
					numDev = numDev + 1;

					await this.pullDevPos(d);

					//delay to not harm hub device
					await this.delay(100);
				} catch (error) {
					getPosErrCnt = getPosErrCnt + 1;
					this.log.warn(
						'failed getting position (device: ' +
							d.name +
							', error counter: ' +
							getPosErrCnt +
							'): ' +
							error,
					);
				}
			}

			//failed position updates exceed threshold
			/*if (getPosErrCnt >= numDev) {
				// getting all positions failed
				this.log.error('restarting adapter because failed position update exceed error counter of ' + numDev);
				//this.restart();
			}*/
		}

		// setup new cycle time
		this.log.debug('scheduling next polling device cycle: ' + this.pollingTimeAllDev + 'ms');
		this.schedulePollAllDevPos(this.pollingTimeAllDev);
	}

	setPollLock(lock) {
		this.isTxLock = lock;
	}

	isTxLocked() {
		return this.isTxLock;
	}

	getDevices() {
		return this.devices;
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			if (this.pollingAllDev) {
				this.clearTimeout(this.pollingAllDev);
				this.pollingAllDev = null;
			}
			if (this.pollingSingleDev) {
				this.clearTimeout(this.pollingSingleDev);
				this.pollingSingleDev = null;
			}

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state && state.ack == false && state.val != null) {
			// The state was changed
			this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			//find out device sn
			const idSplitted = id.split('.');
			const idSetting = idSplitted[idSplitted.length - 1];
			const idSn = parseInt(idSplitted[idSplitted.length - 2]);

			//error checks:
			if (!idSetting.startsWith('setting') && state.val == null) {
				//discard change on not relevant states
				this.log.debug('not a valid state');
				return 0;
			}

			//process state change:
			const dev = this.hub?.getDeviceFromSerialNumber(idSn);
			const newPos = state.val;
			switch (idSetting) {
				case 'setting0': {
					const blindStatus = dev.getPositionFromRam();
					const prevPos = blindStatus.getSetting0Calc();

					if (prevPos != newPos) {
						//req new position
						this.setPollLock(true);
						dev.setPosition(newPos);
						this.setPollLock(false);

						//monitor and update device direction state
						this.updDevDirectionState(dev, prevPos, newPos);
					} else {
						this.log.debug('discarding user requested setting because it is not different to actual value');
					}
					break;
				}
				case 'setting1': {
					if (dev instanceof AsyncVenetianBlind) {
						const set0 = await this.getStateAsync(
							this.name + '.' + this.instance + '.' + dev.SN + '.setting0',
						);

						//req new position
						this.setPollLock(true);
						dev.setPosition(set0, newPos);
						this.setPollLock(false);

						//todo: monitor and update device direction state for tilt
					}
					break;
				}
				default:
					this.log.debug('discard state change because not supported yet');
			}

			//cleanup
			//-
		}
	}

	async updDevDirectionState(dev, curPos, newPos) {
		//update the device direction state once and check for stopped state in devicde polling function

		let isCoverDriving = false;

		if (curPos < newPos) {
			await this.setStateAsync(
				this.name + '.' + this.instance + '.' + dev.SN + '.posState',
				DEV_POS_STATE.CLOSING,
				true,
			);
			isCoverDriving = true;
		} else if (curPos > newPos) {
			await this.setStateAsync(
				this.name + '.' + this.instance + '.' + dev.SN + '.posState',
				DEV_POS_STATE.OPENING,
				true,
			);
			isCoverDriving = true;
		} else {
			//no driving required
			await this.setStateAsync(
				this.name + '.' + this.instance + '.' + dev.SN + '.posState',
				DEV_POS_STATE.STOPPED,
				true,
			);
		}

		if (isCoverDriving) {
			this.log.debug(
				'schedule poll for single device (' + dev.name + ') position: ' + FAST_SINGLE_POLLING_TIME + 'ms',
			);
			this.schedulePollSingleDevPos(dev, FAST_SINGLE_POLLING_TIME);
		}
	}

	schedulePollAllDevPos(t) {
		if (this.pollingAllDev) {
			this.clearTimeout(this.pollingAllDev);
		}
		this.pollingTimeAllDev = t;
		this.pollingAllDev = this.setTimeout(() => {
			this.pollAllDevPos();
		}, t);
	}

	schedulePollSingleDevPos(dev, t) {
		if (this.pollingSingleDev) {
			this.clearTimeout(this.pollingSingleDev);
		}
		this.pollingSingleDev = this.setTimeout(() => {
			this.pollSingleDevPos(dev, t);
		}, t);
	}

	clearScheduleAllDevPos() {
		if (this.pollingAllDev) {
			this.clearTimeout(this.pollingAllDev);
			this.pollingAllDev = null;
		}
	}

	clearScheduleSingleDevPos() {
		if (this.pollingSingleDev) {
			this.clearTimeout(this.pollingSingleDev);
			this.pollingSingleDev = null;
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new WmsWebcontrolPro(options);
} else {
	// otherwise start the instance directly
	new WmsWebcontrolPro();
}
