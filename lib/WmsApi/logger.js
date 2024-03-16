const winston = require('winston');

const LOGGER = winston.createLogger({
	level: 'error',
	format: winston.format.simple(),
	transports: [new winston.transports.Console()],
});

module.exports = LOGGER;
