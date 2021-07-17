const path = require('path');

// Reducing to consume less memory, exceeding it will cause the rendered output to be scaled down
const MAX_CAIRO_DIMENSION = (
	(process.env.MAX_DIMENSION_OVERRIDE <= 32767 ? process.env.MAX_DIMENSION_OVERRIDE : null)
	?? 9830
);

const SINGLE_WHITE_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

const INTERNAL_STATIC_DIR = path.join(__dirname, 'static') + path.sep;
const STOCK_DATA_URL = `https://github.com/paramsiddharth/rema/releases/download/stock-data-v2.0/static.zip`;

module.exports = {
	INTERNAL_STATIC_DIR,
	MAX_CAIRO_DIMENSION,
	SINGLE_WHITE_PIXEL,
	STOCK_DATA_URL
};