'use strict';

/*
 * Created with @iobroker/create-adapter v2.6.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const { AsyncWaremaHub } = require('./lib/WmsApi/asyncHub.js');
const { AsyncVenetianBlind } = require('./lib/WmsApi/devices/AsyncDevices.js');

// Load your modules here, e.g.:
// const fs = require("fs");

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
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
		this.polling = null;
		this.devices = null;
		this.isTxLock = false;
		this.hub = null;
		this.getPosErrCnt = 0;
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here
		this.checkCfg();
		this.hub = new AsyncWaremaHub(this.config.optIp);

		this.updateConStates(true);
		this.log.info('hub device connected.');

		try {
			this.devices = await this.hub.getDevices();
			this.log.debug('wms devices retrieved.');
			this.updateHubStates(this.hub.getStatus());
			this.updateDevStates();
			this.polling = this.setTimeout(() => {
				this.pollDevPos();
			}, 2000);
		} catch (error) {
			this.updateConStates(false);
			this.log.error('Error: ' + error);
			this.disable();
		}
	}

	checkCfg() {
		if (this.config.optIp == '' || this.config.optPollTime < 3) {
			this.log.error('IP address not set or polling time below 3 seconds.');
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
		this.log.debug('creating adapter objects...');
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
		this.log.info('updating hub device objects...');
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
		this.log.debug('creating device objects...');
		for (const d of Object.values(this.devices)) {
			await this.createObj(d.SN + '.name', d.SN + '.name', 'state', 'string', 'string', true, false);
			await this.createObj(d.SN + '.channel', d.SN + '.channel', 'state', 'number', 'number', true, false);
			await this.createObj(d.SN + '.setting0', d.SN + '.setting0', 'state', 'state', 'number', true, true);
			await this.createObj(d.SN + '.setting1', d.SN + '.setting1', 'state', 'state', 'number', true, true);
			await this.createObj(d.SN + '.setting2', d.SN + '.setting2', 'state', 'state', 'number', true, true);
			await this.createObj(d.SN + '.setting3', d.SN + '.setting3', 'state', 'state', 'number', true, true);
			this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.name', d.name, true);
			this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.channel', d.getChannel(), true);

			//subscribe to states
			this.subscribeStates(d.SN + '.setting*');
		}
	}

	async pollDevPos() {
		//clear cylce time
		if (this.polling) {
			this.clearTimeout(this.polling);
			this.polling = null;
			this.log.debug('polling cycle time cleared.');
		}

		this.log.debug('polling of device positions started.');

		const prevPostErrCnt = this.getPosErrCnt;
		let numDev = 0;

		// request new positions
		if (this.isTxLocked() == false) {
			for (const d of Object.values(this.getDevices())) {
				try {
					const pos = await d.getPosition();
					this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting0', pos.setting0, true);
					this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting1', pos.setting1, true);
					this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting2', pos.setting2, true);
					this.setStateAsync(this.name + '.' + this.instance + '.' + d.SN + '.setting3', pos.setting3, true);
					numDev = numDev + 1;
				} catch (error) {
					this.getPosErrCnt++;
					this.log.error(
						'Failed getting device position (err counter is ' + this.getPosErrCnt + '): ' + error,
					);
					//this.restart();
				}
			}
		}

		this.log.debug(
			'calc error counter: ' + (this.getPosErrCnt - prevPostErrCnt) + ', number polled devices: ' + numDev,
		);
		if (this.getPosErrCnt - prevPostErrCnt >= numDev) {
			// getting all positions failed
			this.log.error('could not update position several times -> restarting adapter.');
			this.getPosErrCnt = 0;
			this.restart();
		}

		// setup new cycle time
		this.log.debug(' setting new poll cycle time: ' + this.config.optPollTime * 1000 + 'ms');
		this.polling = this.setTimeout(() => {
			this.pollDevPos();
		}, this.config.optPollTime * 1000);
	}

	setTxLock(lock) {
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
			if (this.polling) {
				this.clearTimeout(this.polling);
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
		if (state && state.ack == false) {
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

			//preperations
			this.setTxLock(true);

			//process state change:
			const dev = this.hub?.getDeviceFromSerialNumber(idSn);
			switch (idSetting) {
				case 'setting0':
					dev.setPosition(state.val);
					break;
				case 'setting1':
					if (dev instanceof AsyncVenetianBlind) {
						const set0 = await this.getStateAsync(
							this.name + '.' + this.instance + '.' + dev.SN + '.setting0',
						);
						dev.setPosition(set0, state.val);
					}
					break;
				default:
					this.log.debug('discard state change because not supported yet');
			}

			//cleanup
			this.setTxLock(false);
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
