# util.pkgwrap

A script wrapper for `package.json` scripts.  This creates a command line program named `pkgwrap`.  It is used to just wrap command line operations used when launching scripts from NPM.  It wraps the following operations:

 - postinstall
 - testing
 - reporting
 - coverage

This implementation wraps the following packages:

- lint: [xo](https://www.npmjs.com/package/xo)
- testing: [ava](https://www.npmjs.com/package/ava)
- reporting: [nyc](https://www.npmjs.com/package/nyc)
- coverage: [coveralls](https://www.npmjs.com/package/coveralls)

The wrapper simplifies the setting of command line parameters to the programs above.  e.g. dynamically setting the temporary directory for nyc output.


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
        "test": "pkgwrap --testing",
        "report": "pkgwrap --reporting"
        "coverage": "pkgwrap --coverage"
    }

### Options

- `--postinstall`: this is executed after `npm install`.  This can be used to create or fix permissions on directories.
- `--testing`: calls lint and testing functions.
- `--reporting`: runs nyc to create information that can be used in reporting testing coverage
- `--coverage`: runs coveralls to upload report details after a successful build.
