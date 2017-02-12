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
const path = require('path');
const fs = require('fs-extra');
const home = require('expand-home-dir');

let argv = require('yargs')
	.usage('Usage: $0 <command>')
	.command('postinstall', 'Executed during the NPM post install')
	.command('build', 'Executes the typescript build command')
	.command('lint', 'Executes the lint tool to check for code errors')
	.command('testing', 'Start the testing process for the module')
	.command('reporting', 'Creates coverage reports after testing')
	.command('coverage', 'Creates nyc report data used by coveralls')
	.help()
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
		console.log(rstrip(data));
	});

	out.on('close', code => {
		console.log(`exit: ${code}`);
	});
}

if (argv.build) {
	call([
		`tslint ./src/**/*.ts`,
		'&&',
		`${bin}/tsc`,
		'-p',
		'.'
	].join(' '));
}

if (argv.testing) {
	call([
		`${bin}/nyc`,
		`--temp-directory=${tmp}`,
		`${bin}/ava`,
		'--verbose'
	].join(' '));
}

if (argv.lint) {
	call([
		`${bin}/xo`
	].join(' '));
}

if (argv.reporting) {
	call([
		`${bin}/nyc`,
		'report',
		`--temp-directory=${tmp}`,
		'--reporter=html'
	].join(' '));
}

if (argv.coverage) {
	call([
		`${bin}/nyc`,
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
