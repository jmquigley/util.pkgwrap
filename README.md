# util.pkgwrap

> A script wrapper for `package.json` scripts.

[![build](https://github.com/jmquigley/util.pkgwrap/workflows/build/badge.svg)](https://github.com/jmquigley/util.pkgwrap/actions)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![NPM](https://img.shields.io/npm/v/util.pkgwrap.svg)](https://www.npmjs.com/package/util.pkgwrap)

This creates a command line program named `pkgwrap` in `node_modules/.bin`.  It is used to wrap command line operations used when launching scripts from [NPM](https://github.com/npm/npm) or [Yarn](https://yarnpkg.com/en/).  The wrapper simplifies the setting of command line parameters for the programs below.  e.g. dynamically setting the temporary directory for nyc output or parallel building of JSX files.

This implementation is opinionated and wraps the following packages:

- build: [typescript](https://www.typescriptlang.org/) (tsc) and [babel](https://babeljs.io/) (if --jsx used)
- clean: [rimraf](https://www.npmjs.com/package/rimraf)
- coverage: [coveralls](https://www.npmjs.com/package/coveralls)
- docs: [jsdoc-to-markdown](https://www.npmjs.com/package/jsdoc-to-markdown) and [JSDoc](http://usejsdoc.org/index.html)
- lint: [tslint](https://palantir.github.io/tslint/)
- reporting: [nyc](https://www.npmjs.com/package/nyc)
- testing: [mocha](https://mochajs.org/) or [ava](https://github.com/avajs/ava) (if --ava used) or [jest](https://facebook.github.io/jest/) (if --jest used).  Most of the projects that use this module use ava for testing.


## Installation

To install as an application dependency with cli:
```
$ npm install --save util.pkgwrap
```

This module must be a regular dependency in a project and NOT a development one.  A package that uses the `pkgwrap` script must have it installed in the `node_modules/.bin` when installed by other packages.  If it is not, then the `pkgwrap` calls for postinstall will fail to find it when your package is installed as a 3rd party dependency.

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

- `--postinstall`: this is executed after `npm install`.  It is used to create directories or fix their permissions (for programs like nyc or coverage).
- `--build`: calls the typescript build process
- `--docs`: generates markdown and website documents for a module
- `--lint`: calls the tslint code checking program
- `--testing`: calls the testing program.  It uses mocha by default.  It can be overriden to use ava with an additonal `--ava` flag or `--jest`.
- `--reporting`: runs nyc to create information that can be used in reporting testing coverage
- `--coverage`: runs coveralls to upload report details after a successful build.
- `--clean`: removes intermediate build/distribution files from the module.  This includes `dist`, `build`, `coverage`.
- `--globals`: takes global dependencies from package.json ("globalDependencies") and installs them.  These follow the same conventions as dependencies/devDependencies.

#### Options

- `--ava`: Used with the `--testing` command to use the [ava](https://github.com/avajs/ava) test runner.
- `--debug`: Turns on verbose output where available.
- `--jest`: Used witht he `--testing` command to use the [jest](https://facebook.github.io/jest/) test runner.
- `--jsx`: Used with the `--build` command to search for `.jsx` files and use babel to transpile them.
- `--minWorkers (5)`: Used with `--build` to set the smallest number of workers in the execution pool for building JSX files with babel (builds JSX files in parallel)
- `--maxWorkers (10)`: Used with `--build` to set the largest number of workers in the execution pool for building JSX files with babel (builds JSX files in parallel)
- `--site`: Used with the `--docs` command to generate a corresponding jsdoc website (jsdoc)
- `--webpack`: Used with the `--build` command to invoke webpack if it is avaialble (or will generate an error if it is not)

#### Dependencies
The following development dependencies must be included within the `package.json` file of the project that uses this cli:

- [ava](https://github.com/avajs/ava)
- [babel](https://babeljs.io/)
- [coveralls](https://www.npmjs.com/package/coveralls)
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
