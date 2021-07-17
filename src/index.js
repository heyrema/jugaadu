#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');
const csv = require('csv-parser');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const resolvePkgPath = require('resolve-package-path');
const chalk = require('chalk');
const tmp = require('tmp');
const { v4: uuid } = require('uuid');
const arrToCSV = require('objects-to-csv');
const PrettyError = require('pretty-error');
const ON_DEATH = require('death')({
	uncaughtException: true
});

const tempDirectory = tmp.dirSync();
process.env.TMP_DIR = tempDirectory.name;

const gracefulExit = code => {
	console.log(`\rCleaning up... 🎀`);
	if (fs.existsSync(tempDirectory.name))
		fs.emptyDirSync(tempDirectory.name);
	tempDirectory.removeCallback();
	console.log(`Exitting Jugaadu Rema... 🌸`);
	process.exit(code);
};

const exitHandler = function(sig, err) {
	let exitCode = 0;
	if (typeof err === 'object') {
		console.error(new PrettyError().render(err));
		exitCode = 1;
	}
	gracefulExit(exitCode);
};

ON_DEATH(exitHandler);
process.on('SIGUSR1', exitHandler.bind(null));
process.on('SIGUSR2', exitHandler.bind(null));

const {
	INTERNAL_STATIC_DIR,
} = require('./constants');

const { getQuote } = require('./helpers/quote');
const {
	validateTemplate,
	validateCertificate
} = require('./helpers/validation');
const { resolveItemPath } = require('./helpers/resolution');
const { previewTemplate, renderCertificate } = require('./helpers/render');
const { convertTo } = require('./helpers/types');
const deps = require('./deps');

if (require.main === module) {
	console.log(`"${getQuote()}"\n – Param Siddharth.\n`);
	console.log(`Welcome to Jugaadu Rema. 🔥`);

	const args = yargs(hideBin(process.argv))
		.usage(`\
Generates a deployable Jugaadu static build of Rema.

Usage: jrema <options>`)
		.option('b', {
			alias: 'base-route',
			desc: 'The route on which the build will be mounted.',
			default: '/'
		})
		.option('l', {
			alias: 'list',
			desc: 'A CSV file containing all records.',
			default: 'records.csv',
		})
		.option('k', {
			alias: 'output',
			desc: 'The CSV file to be generated with updated records.',
			default: 'output.csv',
		})
		.option('t', {
			alias: 'template',
			desc: 'The exported Rema template file.',
			default: 'template.json'
		})
		.option('d', {
			alias: 'directory',
			desc: 'Generate a webpage that lists all certificates.',
			choices: [
				'absent',
				'visible',
				'hidden'
			],
			default: 'absent',
			type: 'string'
		})
		.option('s', {
			alias: 'static-dir',
			desc: 'Rema\'s static directory, needed by templates referencing resources by path.',
			default: 'static'
		})
		.option('o', {
			alias: 'build-dir',
			desc: 'The output build directory.',
			default: 'build'
		})
		.option('preview', {
			desc: 'Previews the template.',
			boolean: true
		})
		.argv;

	const listPath = path.resolve(args.l);
	const staticDir = path.resolve(args.s) + path.sep;
	const buildDir = path.resolve(args.o) + path.sep;
	const outputCsv = path.resolve(args.k);
	const baseRoute = args.b.endsWith('/') ? args.b : (args.b + '/');
	
	process.env.STATIC_DIR = staticDir;
	process.env.TMP_STATIC_DIR = path.join(process.env.TMP_DIR, 'static') + path.sep;
	process.env.BASE_ROUTE = baseRoute;

	(async () => {
		// Perform the initial check(s)
		const initResults = await require('./initCheck')();
		console.log(initResults.msg);
		if (!initResults.success)
			gracefulExit(1);

		let templatePath = resolveItemPath(args.t, true);

		if (!templatePath) {
			console.error(`Template '${args.t}' not found!`);
			gracefulExit(1);
		}

		if (!fs.existsSync(buildDir)) {
			try {
				fs.ensureDirSync(buildDir);
			} catch(e) {
				console.error(`Failed to ensure build directory '${args.t}'!`);
				gracefulExit(1);
			}
		}

		try {
			fs.emptyDirSync(buildDir);
		} catch(e) {
			console.error(`Failed to clear build directory '${args.t}'!`);
			gracefulExit(1);
		}

		let template;
		try {
			template = fs.readJSONSync(templatePath);
			await validateTemplate(template);
			console.log(`Using template '${template.title}'. 🎀`);
		} catch(e) {
			console.error(`Invalid template '${args.t}' (${e.message})!`);
			gracefulExit(1);
		}
		
		let certList = [];
		if (!fs.existsSync(listPath)) {
			console.error(`List '${args.l}' not found!`);
		} else {
			try {
				const done = await new Promise(resolve => {
					let entries = [];

					const listReadStream = fs.createReadStream(listPath, { encoding: 'utf-8' });
					const parser = csv();

					listReadStream.pipe(parser)
						.on('data', entry => entries.push(entry))
						.on('error', e => {
							throw new Error(`Error during parsing CSV: ${e?.message}`);
						}).on('end', async () => {
							for (const item of entries) {
								['template', 'uid', '_id'].forEach(v => {
									if (v in item)
										delete item[v];
								});
				
								let preserve = {};
				
								[
									{
										plac: 'TITLE',
										prop: 'title'
									}
								].forEach(({ plac, prop }) => {
									if (plac in item) {
										if (item[plac] !== '')
											preserve[prop] = item[plac];
										delete item[plac];
									}
								});
				
								let values = Object.keys(item).map(k => ({
									name: k,
									value: item[k] === '' || item[k] == null ? null : item[k]
								})).filter(i => i.value != null);
				
								values = values.map(v => {
									const f = template.fields.filter(f => f.name === v.name)[0];
									if (f == null)
										return v;
									let { name, value } = v;
									if (f.type in convertTo && !f.placeholder)
										value = convertTo[f.type](value);
									if (value == null)
										return v;
									return { name, value };
								});
				
								const certObj = {
									uid: uuid(),
									template: template.name,
									values,
									title: template.title,
									...preserve,
									date: new Date(Date.now()).toISOString()
								};
								
								try {
									await validateCertificate(certObj, template);
								} catch(e) {
									console.error(e.message);
								}
								
								try{
									certList.push(JSON.parse(JSON.stringify(certObj)))
								} catch(e) {
									certList.push({
										...certObj,
										error: e.message
									});
								}
							}

							resolve('OK');
						});
				});

				if (done !== 'OK')
					throw new Error(`Failed to parse list '${args.l}'.`);

				console.log(`Entries loaded! 📜`);
			} catch(e) {
				console.error(`Invalid list '${args.t}' (${e.message})!`);
				gracefulExit(1);
			}
		}

		let responseCSV = [];

		if (args.preview) {
			try {
				console.log(`Generating preview... 👣`);
				const previewDir = path.join(buildDir, 'template');
				const canPNG = await previewTemplate(template);
				fs.outputFileSync(path.join(previewDir, 'template.png'), canPNG.toBuffer('image/png'));
				const canPDF = await previewTemplate(template, 'pdf');
				fs.outputFileSync(path.join(previewDir, 'template.pdf'), canPDF.toBuffer('application/pdf', {
					title: template.title,
					creator: 'Rema © Param Siddharth'
				}));
				const html = await ejs.renderFile(path.join(__dirname, 'views/certificate.ejs'), {
					base: baseRoute,
					info: {
						title: template.title,
						dimensions: template.dimensions
					},
					uid: template.uid,
					download: `template/template`,
					filename: 'template'
				});
				fs.outputFileSync(path.join(previewDir, 'index.html'), html);
				console.log(`Template preview generated! ✨`);
			} catch(e) {
				console.error(`Failed to preview template '${args.t}' (${e.message})!`);
				gracefulExit(1);
			}
		}

		if (fs.existsSync(listPath)) {
			let i = 1;
			for (const item of certList) {
				if (item.error) {
					responseCSV.push({
						...item,
						uid: 'FAILED'
					});
					continue;
				}

				console.log(`Rendering certificate #${i} of ${certList.length}...`);
				try {
					const certDir = path.join(buildDir, 'certificate', item.uid);
					const canPNG = await renderCertificate(item, template);
					fs.outputFileSync(path.join(certDir, 'certificate.png'), canPNG.toBuffer('image/png'));
					const canPDF = await renderCertificate(item, template, 'pdf');
					fs.outputFileSync(path.join(certDir, 'certificate.pdf'), canPDF.toBuffer('application/pdf', {
						title: item.title,
						creator: 'Rema © Param Siddharth'
					}));
					const html = await ejs.renderFile(path.join(__dirname, 'views/certificate.ejs'), {
						base: baseRoute,
						info: {
							title: item.title ?? template.title,
							dimensions: template.dimensions
						},
						uid: item.uid,
						download: `certificate/${item.uid}/certificate`,
						filename: 'certificate'
					});
					fs.outputFileSync(path.join(certDir, 'index.html'), html);
					responseCSV.push(item);
				} catch(e) {
					console.error(`Failed to render certificate #${i} (${e.message})!`);
					responseCSV.push({
						...item,
						uid: 'FAILED'
					});
				}
				i++;
			}

			try {
				console.log(`Exporting updated records... 🌿`);
				const output = new arrToCSV(responseCSV.map(o => {
					const no = { ...o };
					delete no.values;
					for (const value of o.values) {
						no[value.name] = value.value;
						if (!value.visible)
							no[value.name + '_VISIBLE'] = false;
					}
					return no;
				}));
				await output.toDisk(outputCsv);
			} catch(e) {
				console.error(`Failed to save the output list to '${args.k}' (${e.message})!`);
			}
		}

		{
			const files = [
				{
					location: 'index.html',
					template: 'index',
					params: {
						base: baseRoute,
						directory: args.d === 'visible'
					}
				},
				{
					location: '404.html',
					template: '404',
					params: {
						base: baseRoute,
						title: `Not Found`
					}
				}
			];

			if (args.d !== 'absent')
				files.push({
					location: 'directory/index.html',
					template: 'directory',
					params: {
						base: baseRoute,
						certificates: certList.filter(c => c?.error == null).map(c => c.uid)
					}
				});

			for (const file of files) {
				const html = await ejs.renderFile(path.join(__dirname, `views/${file.template}.ejs`), file.params);
				fs.outputFileSync(path.join(buildDir, file.location), html);
			}

			// Copy static files
			console.log(`Copying style and script files... 💞`);
			fs.copySync(path.join(__dirname, 'public'), buildDir);

			// Copy modules
			console.log(`Copying modules... 📜`);
			for (const dep of deps) {
				const depPath = path.dirname(resolvePkgPath(dep, __dirname));
				fs.copySync(depPath, path.join(buildDir, 'modules', dep));
			}
		}

		gracefulExit(0);
	})();
}