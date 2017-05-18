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
	.command('postinstall', 'Executed during the NPM post install')
	.command('build', 'Executes the typescript build command')
	.command('lint', 'Executes the lint tool to check for code errors')
	.command('testing', 'Start the testing process for the module')
	.command('reporting', 'Creates coverage reports after testing')
	.command('coverage', 'Creates nyc report data used by coveralls')
	.describe('ava', 'Used with --testing to use the ava test runner')
	.default('ava', false)
	.describe('jsx', 'used with --build to use babel to build JSX files')
	.default('ava', false)
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

function call(cmd) {
	console.log(cmd);
	let out = ps.exec(cmd);

	out.stdout.on('data', data => {
		console.log(rstrip(data));
		return out;
	});

	out.stderr.on('data', data => {
		console.error(rstrip(data));
	});

	out.on('close', code => {
		console.log(`exit: ${code}`);
		process.exit(code);
	});
}

if (argv.build) {
	call([
		path.resolve(`${bin}/tsc`),
		'-p',
		'.'
	].join(' '));

	// This option will search for JSX files within the project directory and
	// call babel to transpile them.  This assumes that babel is avaialable
	// and is configured.
	if (argv.jsx) {
		console.log(`Searching for JSX files in '${process.cwd()}'`);

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
			if (ignoreList.every(it => {
				return (item.path.indexOf(it) > -1) ? true : false;
			})) return false;

			if (path.extname(item.path) !== '.jsx') {
				return false;
			}

			return true;
		};

		const files = walk(process.cwd(), {
			filter: filterFn
		});

		files.forEach(file => {
			call([
				'babel',
				file.path,
				'-o',
				file.path.slice(0, -1)
			].join(' '));
		});
    }
}

if (argv.testing) {
	call([
		path.resolve(`${bin}/nyc`),
		`--temp-directory=${tmp}`,
		(argv.ava) ? `${bin}/ava` : `${bin}/mocha`,
		(argv.ava) ? '--verbose' : '--require intelli-espower-loader',
		'--harmony-proxies'
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
