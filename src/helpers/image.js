const path = require('path');
const fs = require('fs-extra');
const axios = require('axios').default;
const { nanoid } = require('nanoid');
const {
	extension: mimeExt,
	lookup: mimeType
} = require('mime-types');

const {
	INTERNAL_STATIC_DIR,
	TMP_STATIC_DIR,
	STATIC_DIR
} = require('../constants');
const { resolveItemPath } = require('./resolution');

const DIRS = [
	STATIC_DIR,
	INTERNAL_STATIC_DIR,
	TMP_STATIC_DIR
];

// Test if image is valid
const validateImage = async src => {
	if (!/^(https?\:\/\/|data\:)/.test(src))
		return resolveItemPath(src);
	return true;
};

// Retrieve absolute path if local
const getImageLocation = async src => {
	if (validateImage(src)) {
		if (!/^(https?\:\/\/|data\:)/.test(src))
			return src;

		if (/^https?\:\/\//.test(src)) {
			try {
				const img = await axios.get(src, { responseType: 'arraybuffer' });
				const buf = Buffer.from(img.data, 'base64');
				contentType = img.headers['content-type'];
				if (!contentType.startsWith('image/'))
					return false;
				const ext = mimeExt(contentType);
				const fileName = `image-${nanoid()}.${ext}`;
				const downloadTo = path.join(TMP_STATIC_DIR, 'downloaded', fileName);
				try {
					await fs.outputFile(downloadTo, buf);
				} catch(e) {
					return false;
				}
				return `downloaded/${fileName}`;
			} catch(e) {
				console.error(`Invalid image: ${e.message}`);
				return false;
			}
		}

		{
			try {
				const [DATA, contentType, enc, str] = src.split(/[\:;,]/);

				if (!contentType.startsWith('image/'))
					return false;
				const ext = mimeExt(contentType);
				const fileName = `image-${nanoid()}.${ext}`;
				const downloadTo = path.join(TMP_STATIC_DIR, 'downloaded', fileName);

				const buf = Buffer.from(str, enc);
				try {
					await fs.outputFile(downloadTo, buf);
				} catch(e) {
					return false;
				}

				return `downloaded/${fileName}`;
			} catch(e) {
				console.error(`Failed to parse image data URI: ${e}`);
				console.error(e.stack);
			}
		}
	}
	return false;
};

const imgToBase64 = async name => {
	const buf = await fs.readFile(resolveItemPath(name));
	const extension = path.extname(name);
	const contentType = mimeType(extension);
	const dataURI = `data:${contentType};base64,${buf.toString('base64')}`;
	return dataURI;
};

module.exports = {
	validateImage,
	getImageLocation,
	imgToBase64
};