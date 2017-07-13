#!/usr/bin/env node

/**
 * Commands that can be used by the package.json script to wrap more complex
 * operations.  Generally this would be called using:
 *
 *     node cli.js {option}
 *
 *     OR
 *
 *     pkgwrap {option}
 *
 * The single options would include:
 *
 * - postinstall
 * - build
 * - lint
 * - testing
 * - reporting
 * - coverage
 * - clean
 *
 */

'use strict';

const ps = require('child_process');
const home = require('expand-home-dir');
const globby = require('globby');
const fs = require('fs-extra');
const jsdoc2md = require('jsdoc-to-markdown')
const walk = require('klaw-sync');
const _ = require('lodash');
const workerpool = require('workerpool');
const path = require('path');

const pkg = require(path.join(process.cwd(), 'package.json'));

const pkgbin = path.join(path.join(process.cwd(), 'node_modules', '.bin'));
//const pkgbin = path.join(path.join(process.cwd(), 'node_modules', 'util.pkgwrap', 'node_modules', '.bin'));

let argv = require('yargs')
	.usage('Usage: $0 <command> [--ava --jsx]')
	.command('clean', 'Removes intermediate files from the module')
	.command('docs', 'Generates jsdoc and markdown documents for the project')
	.command('postinstall', 'Executed during the NPM post install')
	.command('build', 'Executes the typescript build command')
	.command('lint', 'Executes the lint tool to check for code errors')
	.command('testing', 'Start the testing process for the module')
	.command('reporting', 'Creates coverage reports after testing')
	.command('coverage', 'Creates nyc report data used by coveralls')
	.describe('ava', 'Used with --testing to use the ava test runner')
	.default('ava', false)
	.describe('debug', 'Turns on verbose messages defined for debugging')
	.default('debug', false)
	.describe('jest', 'Used with --testing to use the jest test runner')
	.default('jest', false)
	.describe('jsx', 'used with --build to use babel to build JSX files')
	.default('jsx', false)
	.describe('minWorkers', 'the smallest number of thread works for JSX build')
	.default('minWorkers', 5)
	.describe('maxWorkers', 'the largest number of thread works for JSX build')
	.default('maxWorkers', 10)
	.describe('site', 'used with --docs to build a site out of jsdoc comments')
	.default('site', false)
	.describe('webpack', 'used with --build to start a webpack build of the current soruce')
	.default('webpack', false)
	.version()
	.help()
	.showHelpOnFail(false, 'Specify --help for available options')
	.argv;

// This is used to setup a temporary directory that the user has
// read/write access.  This makes the user independent of where the
// actual module resides, or the permissions of the module directory
let tmp = home(path.join('~/', '.tmp', '.nyc_output'));

let bin = './node_modules/.bin';
if (!fs.existsSync(tmp)) {
	fs.mkdirsSync(tmp);
}

function rstrip(s) {
	return s.toString().replace(/\r\n$|\n$|\r$/, '');
}

/**
 * Makes a synchronous call to the user supplied command
 * @param cmd {string} the command that will be executed
 * @param quite {boolean} if true, then the command output is suppressed
 */
function call(cmd, quiet = false) {
	if (!quiet) {
		console.log(cmd);
	}

	try {
		ps.execSync(cmd, {stdio:[0,1,2]});
	} catch (err) {
		console.error(err.message);
		process.exit(127);
	}
}

function getJSXFiles(baseDir, verbose=false) {

	if (verbose) {
		console.log(`Searching for JSX files in '${baseDir}'`);
	}

	let ignoreList = [
		'.git',
		'coverage',
		'.nyc_output',
		'dist',
		'node_modules',
		'package'
	];

	const filterFn = (item) => {

		// Check the path against the ignore list.  If the path contains any element of the
		// ignore list, then fail the filter (exclude it with false return)
		for (let i=0; i<ignoreList.length; i++) {
			if (item.path.indexOf(ignoreList[i]) > -1) {
				return false;
			}
		}

		if (path.extname(item.path) !== '.jsx') {
			return false;
		}

		return true;
	};

	const files = walk(baseDir, {
		filter: filterFn
	});

	if (verbose) {
		console.log('Found JSX files:');
		files.forEach(file => {
			console.log(` ~> ${file.path}`);
		});
	}

	return files;
}

function cleanupJSXFilles(files) {
	files.forEach(file => {
		let dst = file.path.slice(0, -1);
		if (fs.existsSync(dst)) {
			fs.removeSync(dst);
		}
	});
}

if (argv.clean) {
	let files = {
		cleanup: [
			'dist',
			'build',
			'coverage',
			'.nyc_output',
			'.DS_Store'
		]
	};

	if (pkg.hasOwnProperty('pkgwrap')) {
		if (pkg.pkgwrap.hasOwnProperty('cleanup') && pkg.pkgwrap.cleanup instanceof Array) {
			files.cleanup = _.union(files.cleanup, pkg.pkgwrap.cleanup);
		}
	}

	let cleanupFiles = files.cleanup.map((val) => {
		return `"${val}"`;
	}).join(' ');

	call([
		path.join(path.join(pkgbin, 'rimraf')),
		cleanupFiles
	].join(' '));

	cleanupJSXFilles(getJSXFiles(process.cwd()));
}

if (argv.build) {
	call([
		'tsc',
		'-p',
		'.'
	].join(' '));

	// This option will search for JSX files within the project directory and
	// call babel to transpile them.  This assumes that babel is available
	// and is configured.  This also assumes that the previous typescript
	// compilation is using the "preserve" option to not interfer with the
	// react compilation
	if (argv.jsx) {

		let baseDir = process.cwd();
		let files = getJSXFiles(baseDir);
		cleanupJSXFilles(files);

		if (argv.webpack) {
			call('webpack');
		}

		if (files.length > 0) {
			console.log(`Compiling JSX Files (${files.length} files)`);

			const pool = workerpool.pool({
				minWorkers: argv.minWorkers,
				maxWorkers: argv.maxWorkers
			});

			const promises = [];

			for (let file of files) {
				console.log(` -> ${file.path}`)
				promises.push(pool.exec((file) => {
					const ps = require('child_process');
					try {
						ps.execSync([
							'babel',
							file.path,
							'-o',
							file.path.slice(0, -1),
							'--source-maps inline'
						].join(' '), {stdio:[0,1,2]});
					} catch (err) {
						return `Error compiling file: ${file.path} -> ${err}`;
					}

					return `compiled: ${file.path}`
				}, [file]));
			}

			Promise.all(promises)
				.then(results => {
					console.log(`Compilation finished - ${results.length} files`);
					pool.clear();
				})
				.catch(err => {
					console.error(`Error in JSX compilation: ${err}`);
				});
		}
    }
}

if (argv.testing) {
	let runner = `${bin}/mocha`;
	let options = ['--require intelli-espower-loader'];
	let preprocessor = '';

	if (argv.ava) {
		preprocessor = path.resolve(`${bin}/nyc`) + ` --temp-directory=${tmp}`;
		runner = `${bin}/ava`;
		options = ['--verbose'];
	}
	if (argv.jest) {
		runner = `${bin}/jest`
		options = [];
	}

	call([
		preprocessor,
		runner,
		options.join(' ')
	].join(' '));
}

if (argv.lint) {
	let files = {
		include: [
			'./lib/**/*.{ts,tsx}',
			'./src/**/*.{ts,tsx}',
			'./test/**/*.{ts,tsx}',
			'test*.{ts,tsx}',
			'index.{ts,tsx}',
			'cli.{ts,tsx}'
		],
		exclude: [
			'./**/*.d.ts'
		]
	};

	if (pkg.hasOwnProperty('pkgwrap')) {
		if (pkg.pkgwrap.hasOwnProperty('include') && pkg.pkgwrap.include instanceof Array) {
			files.include = _.union(files.include, pkg.pkgwrap.include);
		}

		if (pkg.pkgwrap.hasOwnProperty('exclude') && pkg.pkgwrap.exclude instanceof Array) {
			files.exclude = _.union(files.exclude, pkg.pkgwrap.exclude);
		}
	}

	let include = files.include.map((val) => {
		return `"${val}"`;
	}).join(' ');

	let exclude = files.exclude.map((val) => {
		return `--exclude "${val}"`;
	}).join(' ');

	call([
		path.resolve(`${bin}/tslint`),
		include,
	    exclude
	].join(' '));
}

if (argv.reporting) {
	call([
		path.resolve(`${bin}/nyc`),
		'report',
		`--temp-directory=${tmp}`,
		'--reporter=html'
	].join(' '));
}

if (argv.coverage) {
	if (argv.jest) {
		call([
			'cat',
			'./coverage/lcov.info',
			'|',
			`${bin}/coveralls`
		].join(' '));
	} else {
		call([
			path.resolve(`${bin}/nyc`),
			'report',
			`--temp-directory=${tmp}`,
			'--reporter=text-lcov',
			'|',
			`${bin}/coveralls`

		].join(' '));
	}
}

if (argv.postinstall) {
	let directories = [
		'./coverage',
		'./.nyc_output'
	];

	directories.forEach(function(directory) {
		fs.mkdirsSync(directory);
		if (process.platform !== 'win32') {
			ps.execSync(`chmod 777 ${directory}`);
		}
	});
}

if (argv.docs) {
	const srcFiles = [
		'./**/*.js',
		'!gulpfile.js',
		'!./**/*.test.js',
		'!./build/**',
		'!./coverage/**',
		'!./dist/**',
		'!./docs/**',
		'!./node_modules/**',
		'!./packages/**',
		'!./test/**',
		'!./**/*.config.js'
	];
	const files = globby.sync(srcFiles);
	const docsDir = path.join(process.cwd(), 'docs');

	if (!fs.existsSync(docsDir)) {
		fs.mkdirsSync(docsDir);
	}

	if (files.length > 0) {
		console.log('Creating markdown documentation files:');
	}

	files.forEach(filename => {
		let src = path.join(process.cwd(), filename);
		let dst = path.join(docsDir, filename);

		dst = `${dst.substring(0, dst.length - path.extname(dst).length)}.md`;

		if (fs.existsSync(dst)) {
			fs.removeSync(dst);
		} else if (!fs.existsSync(path.dirname(dst))) {
			fs.mkdirsSync(path.dirname(dst));
		}

		if (argv.debug) {
			console.log(` -> Creating ${dst} from ${src}`);
		}

		let mdFile = jsdoc2md.renderSync({files: src});
		fs.writeFileSync(dst, mdFile);
	});

	if (argv.site) {
		console.log('Generating JSDoc site');
		call([
			path.join(pkgbin, 'jsdoc'),
			'-a all',
			'-R ./README.md',
			'-c ./node_modules/util.pkgwrap/jsdoc.conf',
			files.map(filename => {return `${path.join(process.cwd(), filename)}`}).join(' ')
		].join(' '));
	}
}
