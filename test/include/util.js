
const fs = require('fs');
const path = require('path');
const Ini = require('../../src/ini');
const IO = require('@castlelemongrab/ioh');
const Oath = require('@castlelemongrab/oath');
const child_process = require('child_process');

/**
  An asynchronous version of `child_process.runFile`.
**/
const run_process_async = Oath.promisify(child_process.execFile);

/**
  Define a fixture-producing factory method for Chai
**/
const define_factories = (_chai) => {

  _chai.factory.define('fixture', function (_args) {

    return fs.readFileSync(path.join(
      __dirname, '..', 'fixtures', _args.type,
        `${path.basename(_args.name, '.ini')}.ini`
    )).toString();
  });

  return _chai;
};

/**
   Load fixtures and instansiate objects for a test. Return
   a four-tuple array consisting of an `Ini` object, an `IOH`
   object, the expected output string, and the initial input string.
   @arg _chai {Object} - An instance of the Chai testing library
   @arg _name {String} - The name of the test fixture pair to load
   @returns {Array}
 */
const init_fixture_test = (_chai, _name) => {

  let i = _chai.factory.create(
    'fixture', { type: 'input', name: _name }
  );
  let o = _chai.factory.create(
    'fixture', { type: 'output', name: _name }
  );

  let io = new IO.NodePlug();
  let ini = new Ini.Default(i, { io: io });

  return [ ini, io, o, i ];
}

/**
**/
const run_process = async (_file, _argv) => {

  return await run_process_async(_file, _argv);
};

module.exports = {
  run_process: run_process,
  define_factories: define_factories,
  init_fixture_test: init_fixture_test
};

