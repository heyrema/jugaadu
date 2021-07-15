/**
 * Environment variables:
 * NO_MINIFY: Any non-zero value turns minification off
 * PORT: The port the development server runs on (default: 8081)
 * BASE_ROUTE: The route on which the output is to be mounted, '/' by default.
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs-extra');
const { statusCode } = require('statushttp');
const express = require('express');
const expressMinify = require('express-minify');
const expressMinifyHTML = require('express-minify-html-2');
const liveReload = require('livereload');
const connectLiveReload = require('connect-livereload');
const morgan = require('morgan');

const PORT = process.env.PORT ?? 8081;
const BUILD_DIR = path.join(__dirname, 'build');
const BASE_ROUTE = process.env.BASE_ROUTE ?
	(
		process.env.BASE_ROUTE.endsWith('/') ? process.env.BASE_ROUTE : process.env.BASE_ROUTE + '/'
	)
	: '/';

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

const app = express();

app.set('view engine', 'ejs');
app.use(connectLiveReload());
app.use(morgan('dev'));

if (!process.env.NO_MINIFY) {
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
}

const router = express.Router();

router.route([
	`/certificate/:uid`,
	`/certificate/:uid/index`,
	`/certificate/:uid/index.html`
])
.get(async (req, res) => {
	const CERT_DIR = path.join(BUILD_DIR, 'certificate');
	await fs.ensureDir(CERT_DIR);

	const { uid } = req.params;
	
	const DIR_IN_FOCUS = path.join(CERT_DIR, uid);
	if (!await fs.pathExists(DIR_IN_FOCUS)) {
		return res.status(statusCode.NOT_FOUND).render('404', {
			base: BASE_ROUTE,
			title: 'Invalid ID'
		});
	}
	
	try {
		const info = await fs.readJSON(path.join(DIR_IN_FOCUS, 'certificate.json'));
		return res.status(statusCode.OK).render('certificate', {
			info, uid,
			base: BASE_ROUTE
		});
	} catch(e) {
		console.log(e.message);
		console.log(e.stack);
		return res.status(statusCode.NOT_FOUND).render('404');
	}
});

router.route('/')
.get((req, res) => {
	return res.status(statusCode.OK).render('index', {
		base: BASE_ROUTE
	});
});

router.use(`/modules`, express.static(path.join(__dirname, 'node_modules')));
router.use(`/`, express.static(path.join(__dirname, 'public')));
router.use(`/`, express.static(path.join(__dirname, 'build')));

router.route('*')
.all((req, res) => res.status(statusCode.NOT_FOUND).render('404', { base: BASE_ROUTE }));

app.use(BASE_ROUTE, router);

const server = app.listen(PORT, () => console.log(`Jugaadu Rema Development Server running on port ${PORT}. 😎`));