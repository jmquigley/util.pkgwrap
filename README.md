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

- build: [typescript](https://www.typescriptlang.org/)
- lint: [tslint](https://palantir.github.io/tslint/)
- testing: [mocha](https://mochajs.org/)
- reporting: [nyc](https://www.npmjs.com/package/nyc)
- coverage: [coveralls](https://www.npmjs.com/package/coveralls)


## Installation

To install as a global package and cli:
```
$ npm install --global util.pkgwrap
```

To install as an application dependency with cli:
```
$ npm install --save-dev util.pkgwrap
```

## Usage
This is a command line package used with the `scripts` section of `pacakge.json`.  An example would be:

    "scripts": {
        "postinstall": "pkgwrap --postinstall",
	    "build": "pkgwrap --build",
        "lint": "pkgwrap --lint",
        "test": "pkgwrap --testing",
        "report": "pkgwrap --reporting"
        "coverage": "pkgwrap --coverage"
    }

### Options

- `--postinstall`: this is executed after `npm install`.  It is used to create directoris or fix their permissions.
- `--build`: calls the typescript build process
- `--lint`: calls the tslint code checking program
- `--testing`: calls the mocha testing program.  This script includes the use of powerassert.
- `--reporting`: runs nyc to create information that can be used in reporting testing coverage
- `--coverage`: runs coveralls to upload report details after a successful build.


### Dependencies
The following development dependencies must be included within the `package.json` file of the project that uses this cli:

- [coveralls](https://www.npmjs.com/package/coveralls)
- [gulp](https://www.npmjs.com/package/gulp)
- [gulp-cli](https://www.npmjs.com/package/gulp-cli)
- [intelli-espower-loader](https://www.npmjs.com/package/intelli-espower-loader)
- [jsdoc](https://www.npmjs.com/package/jsdoc)
- [mocha](https://www.npmjs.com/package/mocha)
- [nyc](https://www.npmjs.com/package/nyc)
- [powerassert](https://www.npmjs.com/package/power-assert)
- [typescript](https://www.npmjs.com/package/typescript)
- [tslint](https://www.npmjs.com/package/tslint)
