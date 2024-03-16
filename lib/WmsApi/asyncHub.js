const axios = require('axios'); // Assuming axios for HTTP requests

const { encode } = require('./shrouding.js');
const BaseHub = require('./baseHub.js');
const LOGGER = require('./logger.js');

class AsyncWaremaHub extends BaseHub {
	constructor(webAddress, ipPort = 80) {
		super(webAddress, ipPort);
		LOGGER.debug('web address set: ' + this.webAddress);
		this.session = axios.create({ baseURL: this.webAddress });
	}

	/* 	async __awaiter() {
		if (this.session.isAxiosError && this.session.isAxiosError(this.session)) {
			this.session = axios.create({ baseURL: this.webAddress });
		}
		return this;
	} */

	async closeSession() {
		//not implemented
		return;
	}

	async getHubInfo() {
		const status = await this.request('info');
		super.setStatus(status);
		return super.getStatus();
	}

	async channelCommandRequest(ch, fn, s0, s1, s2, s3) {
		await this.post(super._channelCommandRequest(ch, fn, s0, s1, s2, s3));
	}

	async manualCommandRequest(sn) {
		return await this.post(super._manualCommandRequest(sn));
	}

	async mb8Read(block, adr, eui, length) {
		const response = await this.post(super._mb8Read(block, adr, eui, length));
		response.data = Buffer.from(response.data, 'base64');
		return response;
	}

	async getDevices() {
		if (!super.isStatus()) {
			LOGGER.debug('getting hub info');
			await this.getHubInfo();
		}

		LOGGER.debug('serial number of hub controller: ' + super.getStatus().serialNumber);
		const response = await this.mb8Read(42, 0, parseInt(super.getStatus().serialNumber), 62 * 20);
		return super._processReceiverBlock(response.data, false);
	}

	async getBlock(block, adr = 0, length = 188 * 10) {
		// Block details commented out, logic remains similar to mb8Read
		return await this.mb8Read(block, adr, parseInt(this.status.serialNumber), length);
	}

	async request(path = 'info') {
		LOGGER.debug(`Get message from: ${this.webAddress}/${path}`);

		try {
			const response = await this.session.get(`/${path}`, { timeout: 30000, responseType: 'arraybuffer' }); // Assuming 10 seconds timeout
			//LOGGER.debug("response: " + response.data);
			return super._processResponse(response.data);
		} catch (error) {
			// Handle errors appropriately, e.g., logging, retries
			console.error('Error during request:', error);
			throw error; // Re-throw for further handling
		}
	}

	async post(message = '', path = 'postMessage') {
		LOGGER.debug(`Post message: ${message}`);
		const data = encode(message);

		try {
			const response = await this.session.post(`/${path}`, data, { timeout: 30000, responseType: 'arraybuffer' }); // Assuming 10 seconds timeout
			return super._processResponse(response.data);
		} catch (error) {
			// Handle errors appropriately, e.g., logging, retries
			console.error('Error during post:', error);
			throw error; // Re-throw for further handling
		}
	}
}

module.exports = { AsyncWaremaHub };
