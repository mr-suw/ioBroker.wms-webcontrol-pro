const winston = require('winston');

const LOGGER = winston.createLogger({
	level: 'info',
	format: winston.format.simple(),
	transports: [new winston.transports.Console()],
});

module.exports = LOGGER;
