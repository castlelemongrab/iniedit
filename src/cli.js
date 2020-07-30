// ✊🏿

'use strict';

const Base = require('./base');
const Arguments = require('./arguments');

/**
  The command-line interface to Parlance.
  @extends Base
**/
const CLI = class extends Base {

  /**
   */
  constructor (_options) {

    super(_options);
    
    this._args = new Arguments();
    return this;
  }

  /**
   */
  async run () {

    let args = this._args.parse();
    return true;
  }
};

/* Export symbols */
module.exports = CLI;

