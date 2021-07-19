const path = require('path');
const fs = require('fs-extra');
const minify = require('minify');

const options = {
	html: {
		removeAttributeQuotes: false,
		removeOptionalTags: false,
		collapseWhitespace: true,
		collapseInlineTagWhitespace: false,
		conservativeCollapse: true
	},
	img: {
		maxSize: 0
	}
};

const minifyFile = async file => {
	const type = path.extname(file);

	if (!fs.existsSync(file))
		throw new Error(`File not found: ${file}`);

	switch (type) {
		case '.html':
		case '.css':
		case '.js':
			return await minify(file, options);
		default:
			return await fs.readFile(file);
	}
};

module.exports = {
	minify: minifyFile
};