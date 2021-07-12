require('dotenv').config();

const path = require('path');
const express = require('express');
const expressMinify = require('express-minify');
const expressMinifyHTML = require('express-minify-html-2');
const liveReload = require('livereload');
const connectLiveReload = require('connect-livereload');

const liveReloadServer = liveReload.createServer({
	extraExts: [
		'ejs'
	]
});
liveReloadServer.watch(__dirname);

liveReloadServer.server.once("connection", () => {
	setTimeout(() => {
		liveReloadServer.refresh("/");
	}, 100);
});

const PORT = process.env.PORT ?? 8081;

const app = express();

app.set('view engine', 'ejs');
app.use(connectLiveReload());
app.use(expressMinify());
app.use(expressMinifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true
    }
}));

app.route([
	'/certificate/:name',
	'/certificate/:name/index',
	'/certificate/:name/index.html'
])
.get(async (req, res) => {
	return res.render('certificate', {
		cert: process.env.IMG_URL,
		width: process.env.IMG_WIDTH,
		height: process.env.IMG_HEIGHT
	});
});

app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/static', express.static(path.join(__dirname, 'static')));

const server = app.listen(PORT, () => console.log(`Jugaadu Rema Development Server running on port ${PORT}. 😎`));