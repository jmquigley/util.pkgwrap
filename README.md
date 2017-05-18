# util.pkgwrap [![Build Status](https://travis-ci.org/jmquigley/util.pkgwrap.svg?branch=master)](https://travis-ci.org/jmquigley/util.pkgwrap) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.pkgwrap.svg)](https://www.npmjs.com/package/util.pkgwrap)

> A script wrapper for `package.json` scripts.

This creates a command line program named `pkgwrap`.  It is used to just wrap command line operations used when launching scripts from NPM.  It wraps the following operations:

 - postinstall
 - build
 - lint
 - testing
 - reporting
 - coverage

The wrapper simplifies the setting of command line parameters to the programs above.  e.g. dynamically setting the temporary directory for nyc output.


This implementation is opinionated and wraps the following packages:

- build: [typescript](https://www.typescriptlang.org/) and [babel](https://babeljs.io/) (if --jsx used)
- lint: [tslint](https://palantir.github.io/tslint/)
- testing: [mocha](https://mochajs.org/) or [ava](https://github.com/avajs/ava) (if --ava used)
- reporting: [nyc](https://www.npmjs.com/package/nyc)
- coverage: [coveralls](https://www.npmjs.com/package/coveralls)


## Installation

To install as an application dependency with cli:
```
$ npm install --save util.pkgwrap
```

## Usage
This is a command line package used with the `scripts` section of `package.json`.  An example would be:

    "scripts": {
        "postinstall": "pkgwrap --postinstall",
	    "build": "pkgwrap --build --jsx",
        "lint": "pkgwrap --lint",
        "test": "pkgwrap --testing --ava",
        "report": "pkgwrap --reporting"
        "coverage": "pkgwrap --coverage"
    }

#### Commands

- `--postinstall`: this is executed after `npm install`.  It is used to create directoris or fix their permissions.
- `--build`: calls the typescript build process
- `--lint`: calls the tslint code checking program
- `--testing`: calls the testing program.  It uses mocha by default.  It can be overriden to use ava with an additonal `--ava` flag.
- `--reporting`: runs nyc to create information that can be used in reporting testing coverage
- `--coverage`: runs coveralls to upload report details after a successful build.

#### Options

- `--ava`: Used with the `--testing` command to use the ava test runner.
- `--jsx`: Used with the `--build` command to search for `.jsx` files and use babel to transpile them.

#### Dependencies
The following development dependencies must be included within the `package.json` file of the project that uses this cli:

- [ava](https://github.com/avajs/ava)
- [babel](https://babeljs.io/)
- [coveralls](https://www.npmjs.com/package/coveralls)
- [gulp](https://www.npmjs.com/package/gulp)
- [gulp-cli](https://www.npmjs.com/package/gulp-cli)
- [intelli-espower-loader](https://www.npmjs.com/package/intelli-espower-loader) (if using mocha)
- [jsdoc](https://www.npmjs.com/package/jsdoc)
- [mocha](https://www.npmjs.com/package/mocha)
- [nyc](https://www.npmjs.com/package/nyc)
- [powerassert](https://www.npmjs.com/package/power-assert) (if using mocha)
- [typescript](https://www.npmjs.com/package/typescript)
- [tslint](https://www.npmjs.com/package/tslint)
