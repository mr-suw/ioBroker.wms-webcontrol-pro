const winston = require('winston');

const LOGGER = winston.createLogger({
	level: 'none',
	format: winston.format.simple(),
	transports: [new winston.transports.Console()],
});

module.exports = LOGGER;
