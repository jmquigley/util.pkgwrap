# util.pkgwrap [![Build Status](https://travis-ci.org/jmquigley/util.pkgwrap.svg?branch=master)](https://travis-ci.org/jmquigley/util.pkgwrap) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.pkgwrap.svg)](https://www.npmjs.com/package/util.pkgwrap)

> A script wrapper for `package.json` scripts.

This creates a command line program named `pkgwrap`.  It is used to just wrap command line operations used when launching scripts from NPM.  The wrapper simplifies the setting of command line parameters to the programs above.  e.g. dynamically setting the temporary directory for nyc output.

This implementation is opinionated and wraps the following packages:

- build: [typescript](https://www.typescriptlang.org/) and [babel](https://babeljs.io/) (if --jsx used)
- clean: [rimraf](https://www.npmjs.com/package/rimraf)
- coverage: [coveralls](https://www.npmjs.com/package/coveralls)
- docs: [jsdoc-to-markdown](https://www.npmjs.com/package/jsdoc-to-markdown) and [JSDoc](http://usejsdoc.org/index.html)
- lint: [tslint](https://palantir.github.io/tslint/)
- reporting: [nyc](https://www.npmjs.com/package/nyc)
- testing: [mocha](https://mochajs.org/) or [ava](https://github.com/avajs/ava) (if --ava used) or [jest](https://facebook.github.io/jest/) (if --jest used)


## Installation

To install as an application dependency with cli:
```
$ npm install --save util.pkgwrap
```

## Usage
This is a command line package used with the `scripts` section of `package.json`.  An example would be:

    "scripts": {
	    "build": "pkgwrap --build --jsx",
		"clean": "pkgwrap --clean",
        "coverage": "pkgwrap --coverage",
		"docs": "pkgwrap --docs --site",
        "lint": "pkgwrap --lint",
        "postinstall": "pkgwrap --postinstall",
        "report": "pkgwrap --reporting",
        "test": "pkgwrap --testing --ava"
    }

#### Commands

- `--postinstall`: this is executed after `npm install`.  It is used to create directoris or fix their permissions.
- `--build`: calls the typescript build process
- `--docs`: generates markdown and website documents for a module
- `--lint`: calls the tslint code checking program
- `--testing`: calls the testing program.  It uses mocha by default.  It can be overriden to use ava with an additonal `--ava` flag.
- `--reporting`: runs nyc to create information that can be used in reporting testing coverage
- `--coverage`: runs coveralls to upload report details after a successful build.
- `--clean`: removes intermediate build/distribution files from the module.  This includes `dist`, `build`, `coverage`.

#### Options

- `--ava`: Used with the `--testing` command to use the [ava](https://github.com/avajs/ava) test runner.
- `--jest`: Used witht he `--testing` command to use the [jest](https://facebook.github.io/jest/) test runner.
- `--jsx`: Used with the `--build` command to search for `.jsx` files and use babel to transpile them.
- `--site`: Used with the `--docs` command to generate a corresponding jsdoc website (jsdoc)
- `--webpack`: Used with the `--build` command to invoke webpack if it is avaialble

#### Dependencies
The following development dependencies must be included within the `package.json` file of the project that uses this cli:

- [ava](https://github.com/avajs/ava)
- [babel](https://babeljs.io/)
- [coveralls](https://www.npmjs.com/package/coveralls)
- [gulp](https://www.npmjs.com/package/gulp)
- [gulp-cli](https://www.npmjs.com/package/gulp-cli)
- [intelli-espower-loader](https://www.npmjs.com/package/intelli-espower-loader) (if using mocha)
- [jest](https://facebook.github.io/jest/)
- [jsdoc](https://www.npmjs.com/package/jsdoc)
- [jsdoc-to-markdown](https://www.npmjs.com/package/jsdoc-to-markdown)
- [mocha](https://www.npmjs.com/package/mocha)
- [nyc](https://www.npmjs.com/package/nyc)
- [powerassert](https://www.npmjs.com/package/power-assert) (if using mocha)
- [rimraf](https://www.npmjs.com/package/rimraf)
- [typescript](https://www.npmjs.com/package/typescript)
- [tslint](https://www.npmjs.com/package/tslint)
