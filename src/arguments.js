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
        's', {
          array: true,
          type: 'string',
          alias: 'section',
          describe: 'Operate only on a specific section name'
        }
      )
      .option(
        'p', {
          array: true,
          type: 'string',
          alias: 'property',
          describe: 'Operate only in a section with a specific property'
        }
      )
      .option(
        'c', {
          array: true,
          type: 'string',
          alias: 'comment',
          describe: 'Operate only in a section with a specific comment'
        }
      )
      .command(
        'add', 'Add an entire section to an INI file', {
          n: {
            type: 'string',
            alias: 'name',
            demandOption: true,
            describe: 'The name of the section to add'
          },
          l: {
            array: true,
            type: 'string',
            alias: 'line',
            demandOption: true,
            describe: 'The line to add in key-equals-value format'
          }
        }
      )
      .command(
        'delete', 'Delete an entire section of an INI file'
      )
      .command(
        'add-lines', 'Add some lines to an INI file section', {
          l: {
            array: true,
            type: 'string',
            alias: 'line',
            demandOption: true,
            describe: 'The line to add in key-equals-value format'
          }
        }
      )
      .command(
        'delete-lines', 'Delete some lines from an INI file section', {
          l: {
            array: true,
            type: 'string',
            alias: 'line',
            demandOption: true,
            describe: 'The property name you wish to remove'
          }
        }
      );

    return this;
  }
};

/* Export symbols */
module.exports = Arguments;

