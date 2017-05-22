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
 */

'use strict';

const ps = require('child_process');
const home = require('expand-home-dir');
const fs = require('fs-extra');
const walk = require('klaw-sync');
const _ = require('lodash');
const path = require('path');

const pkg = require(path.join(process.cwd(), 'package.json'));

let argv = require('yargs')
	.usage('Usage: $0 <command> [--ava --jsx]')
	.command('clean', 'Removes intermediate files from the module')
	.command('postinstall', 'Executed during the NPM post install')
	.command('build', 'Executes the typescript build command')
	.command('lint', 'Executes the lint tool to check for code errors')
	.command('testing', 'Start the testing process for the module')
	.command('reporting', 'Creates coverage reports after testing')
	.command('coverage', 'Creates nyc report data used by coveralls')
	.describe('ava', 'Used with --testing to use the ava test runner')
	.default('ava', false)
	.describe('jest', 'Used with --testing to use the jest test runner')
	.default('jest', false)
	.describe('jsx', 'used with --build to use babel to build JSX files')
	.default('jsx', false)
	.describe('jsxtest', 'used with --build to use bable to build JSX files in the test directory')
	.default('jsxtest', false)
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

function getJSXFiles(baseDir) {
	console.log(`Searching for JSX files in '${baseDir}'`);

	let ignoreList = [
		'.git',
		'build',
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
		'./node_modules/util.pkgwrap/node_modules/.bin/rimraf',
		cleanupFiles
	].join(' '));

	cleanupJSXFilles(getJSXFiles(process.cwd()));
}

if (argv.build) {
	call([
		path.resolve(`${bin}/tsc`),
		'-p',
		'.'
	].join(' '));

	// This option will search for JSX files within the project directory and
	// call babel to transpile them.  This assumes that babel is available
	// and is configured.  The "jsxtest" version will only look in the test
	// directory for files.
	if (argv.jsx || argv.jsxtest) {

		let baseDir = process.cwd();
		if (argv.jsxtest) {
			baseDir = path.join(baseDir, 'test')
		}

		let files = getJSXFiles(baseDir);
		cleanupJSXFilles(files);

		if (argv.webpack) {
			call('webpack');
		}

		if (files.length > 0) {
			console.log('Compiling JSX Files:');
		}

		files.forEach(file => {
			console.log(` - ${file.path}`);
			call([
				'babel',
				file.path,
				'-o',
				file.path.slice(0, -1),
				'--source-maps inline'
			].join(' '), true);
		});
    }
}

if (argv.testing) {
	let runner = `${bin}/mocha`;
	let options = ['--require intelli-espower-loader'];
	if (argv.ava) {
		runner = `${bin}/ava`;
		options = ['--verbose', '--harmony-proxies'];
	}
	if (argv.jest) {
		runner = `${bin}/jest`
		options = [''];
	}

	call([
		path.resolve(`${bin}/nyc`),
		`--temp-directory=${tmp}`,
		runner,
		options.join(' ')
	].join(' '));
}

if (argv.lint) {
	let files = {
		include: [
			'./lib/**/*.ts',
			'./src/**/*.ts',
			'./test/**/*.ts',
			'test*.ts',
			'index.ts',
			'cli.ts'
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
		return `--exclude="${val}"`;
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
	call([
		path.resolve(`${bin}/nyc`),
		'report',
		`--temp-directory=${tmp}`,
		'--reporter=text-lcov',
		'|',
		`${bin}/coveralls`

	].join(' '));
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
