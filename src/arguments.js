// ✊🏿

'use strict';

const Base = require('./base');

/**
  An argument parser for command-line invocation.
  @extends Base
**/
const Arguments = class extends Base {

  /**
   */
  constructor (_options) {

    super(_options);

    /* To do: this probably isn't ideal */
    this._yargs = require('yargs');

    return this._setup();
  }

  /**
   */
  parse () {

    return this._yargs.argv;
  }

  /**
   */
  _setup () {

    this._yargs.demandCommand(1)
      .option(
        'h', {
          type: 'boolean',
          alias: 'help',
          describe: 'Show help'
        }
      )
      .option(
        'x', {
          array: true,
          type: 'string',
          alias: 'require-section',
          describe: 'Only modify this section name matches'
        }
      )
      .option(
        'n', {
          array: true,
          type: 'string',
          alias: 'require-line',
          describe: 'Only modify if this key=value line exists'
        }
      )
      .option(
        'm', {
          array: true,
          type: 'string',
          alias: 'require-comment',
          describe: 'Only modify if this comment exists'
        }
      )
      .option(
        'r', {
          type: 'boolean',
          alias: 'regex',
          describe: 'Use regular expressions for all matches'
        }
      )
      .command(
        'add', 'Add an entire section to an INI file', {
          s: {
            type: 'string',
            alias: 'name',
            demandOption: true,
            describe: 'The name of the section to add'
          },
          l: {
            array: true,
            alias: 'line',
            type: 'string',
            describe: 'A key=value line to add, or - for stdin'
          },
          c: {
            array: true,
            type: 'string',
            alias: 'comment',
            describe: 'A comment string to add'
          },
        }
      )
      .command(
        'delete', 'Delete an entire section of an INI file'
      )
      .command(
        'modify', 'Modify properties in an INI file section', {
          l: {
            array: true,
            alias: 'line',
            type: 'string',
            describe: 'A key=value line to add, or - for stdin'
          },
          c: {
            array: true,
            type: 'string',
            alias: 'comment',
            describe: 'A comment string to add'
          },
          d: {
            array: true,
            type: 'string',
            alias: 'delete',
            describe: 'A property name to delete'
          }
        }
      );

    return this;
  }
};

/* Export symbols */
module.exports = Arguments;

