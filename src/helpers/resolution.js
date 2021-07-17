const path = require('path');
const fs = require('fs-extra');

const { INTERNAL_STATIC_DIR } = require('../constants');

const resolveItemPath = (src, cwd = false) => {
	const { STATIC_DIR, TMP_STATIC_DIR } = process.env;

	let DIRS = [
		STATIC_DIR,
		TMP_STATIC_DIR,
		INTERNAL_STATIC_DIR
	];

	if (cwd !== false)
		DIRS = [ process.cwd(), ...DIRS ];

	for (const DIR of DIRS) {
		if (DIR == null || src == null)
			continue;
		const location = path.join(DIR, src);
		if (fs.existsSync(location))
			return location;
	}

	return false;
};

module.exports = {
	resolveItemPath
};