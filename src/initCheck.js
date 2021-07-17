const fs = require('fs-extra');
const path = require('path');
const axios = require('axios').default;
const unzip = require('unzipper');

const {
	STOCK_DATA_URL,
	INTERNAL_STATIC_DIR
} = require('./constants');

const checks = {
	stockMaterial: {
		msg: `Checking if stock material exists...`,
		action: async () => {
			try {
				fs.ensureDirSync(INTERNAL_STATIC_DIR);
			} catch(e) {
				throw new Error(`Failed to ensure internal static directory '${INTERNAL_STATIC_DIR}' (${e.message})!`);
			}

			if (!fs.existsSync(INTERNAL_STATIC_DIR))
				throw new Error(`Missing internal static directory '${INTERNAL_STATIC_DIR}'!`);

			const stockDir = path.resolve(INTERNAL_STATIC_DIR, 'stock') + path.sep;

			if (!fs.existsSync(stockDir) || !fs.existsSync(path.join(INTERNAL_STATIC_DIR, 'items.json'))) {
				console.log(`Stock material not found! Downloading...`);

				try {
					fs.ensureDirSync(stockDir);
					fs.emptyDirSync(stockDir);

					const stockZip = path.join(process.env.TMP_DIR, 'stock.zip');

					const done = await new Promise(async resolve => {
						const resp = await axios.get(STOCK_DATA_URL, { responseType: 'stream' });
						const downloadStream = fs.createWriteStream(stockZip);
						resp.data.pipe(downloadStream);

						downloadStream.on('close', () => {
							console.log(`Download finished! Extracting...`);
							const extractStream = fs.createReadStream(stockZip);
							const extractionStream = unzip.Extract({ path: INTERNAL_STATIC_DIR });
							extractStream.pipe(extractionStream);
							extractionStream.on('close', () => resolve('OK'));
						});
					});

					if (done !== 'OK')
						throw new Error();

					console.log(`Extracted!`);
				} catch(e) {
					throw new Error(`Couldn't ensure stock material in Jugaadu Rema (${e.message})!`);
				}
			}

			return `Stock material loaded!`;
		},
		critical: false
	}
};

module.exports = async () => {
	console.log(`Performing initial checks...`);

	let i = 1;
	let successCount = 0;
	let failureCount = 0;
	let criticalFailureCount = 0;

	for (const checkID in checks) {
		const {
			msg,
			action,
			critical
		} = checks[checkID];

		console.log(`${i}. ${msg}`);
		try {
			const ret = await action();
			console.log(ret);
			successCount++;
		} catch(e) {
			console.log(e.message);
			failureCount++;
			if (critical)
				criticalFailureCount++;
		}

		i++;
	}

	return {
		success: criticalFailureCount === 0,
		msg: `\
${successCount > 0 ? '✔' : '-'} ${successCount} check(s) passed!
${failureCount > 0 ? '❌' : '✔'} ${failureCount} check(s) failed!\
${
	criticalFailureCount > 0
	? `\n❌ ${criticalFailureCount} critical check(s) failed!`
	: ''
}`
	};
};