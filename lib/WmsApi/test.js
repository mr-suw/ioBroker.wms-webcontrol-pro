const { AsyncWaremaHub } = require('./asyncHub.js');

async function position(device) {
	try {
		const status = await device.getPosition();
		console.log(device.name, device.SN, status);
	} catch (error) {
		console.error('Error getting device position:', error);
	}
}

async function main() {
	const hub = new AsyncWaremaHub('192.168.10.10');

	try {
		const devices = await hub.getDevices();

		const tasks = [];
		for (const device of Object.values(devices)) {
			// Iterate through device values
			tasks.push(position(device));
		}

		await Promise.all(tasks); // Wait for all tasks to finish

		/*
        console.log('Set position for Büro Rollladen');
        const buero = hub.getDeviceFromSerialNumber(1143662);
        await buero.setPosition(0); // Uncomment to set position

        console.log('wait 10 seconds');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds

        tasks.push(position(buero));
        await Promise.all(tasks);
        */
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await hub.closeSession();
	}
}

main();
