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
        'v', {
          type: 'boolean',
          alias: 'verbose',
          describe: 'Print extra information to standard error'
        }
      )
      .option(
        'f', {
          type: 'string',
          alias: 'file',
          demandOption: true,
          describe: 'The input file in common INI format'
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
          describe: 'Only modify if this line exists'
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
          describe: 'Interpret match criteria as expressions'
        }
      )
     .command(
        'read', 'Read from one or more matched sections', {
          l: {
            array: true,
            type: 'string',
            alias: 'line',
            describe: 'The property/line values to read'
          },
          c: {
            type: 'boolean',
            alias: 'comments',
            describe: 'Also print all comments, in order'
          }
        }
      )
      .command(
        'add', 'Add an entire section to an INI file', {
          s: {
            type: 'string',
            alias: 'section',
            demandOption: true,
            describe: 'The name of the section to add'
          },
          l: {
            array: true,
            alias: 'line',
            type: 'string',
            describe: 'A line to add, or key name to read from stdin'
          },
          c: {
            array: true,
            type: 'string',
            alias: 'comment',
            describe: 'A comment string to add'
          },
          t: {
            type: 'boolean',
            alias: 'top',
            describe: 'Add the new section to the top of the file'
          }
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
            describe: 'A line to add, or key name to read from stdin'
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
            alias: 'delete-line',
            describe: 'A line name to delete'
          },
          o: {
            array: true,
            type: 'string',
            alias: 'delete-comment',
            describe: 'A comment string to delete'
          },
          e: {
            type: 'string',
            alias: 'section',
            description: 'A replacement section name'
          }
        }
      );

    return this;
  }
};

/* Export symbols */
module.exports = Arguments;

