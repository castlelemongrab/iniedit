
'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const uuid = require('uuid');
const Ini = require('../../src/ini');
const util = require('../include/util');
const IO = require('@castlelemongrab/ioh');
const promises = require('chai-as-promised');
const Oath = require('@castlelemongrab/oath');
const factories = require('chai-js-factories');

/**
 */
describe('cli', () => {

  let expect = chai.expect;
  let should = chai.should();

  chai.use(promises);
  chai.use(factories);

  let io = new IO.Node();
  let unlink = Oath.promisify(fs.unlink);
  let temp_path = path.join(__dirname, '..', 'temp');
  let fixtures_in = path.join(__dirname, '..', 'fixtures', 'input');
  let fixtures_out = path.join(__dirname, '..', 'fixtures', 'output');
  let iniedit_path = path.join(__dirname, '..', '..', 'bin', 'iniedit');
  
  /**
  **/
  const iniedit_init = async (_file) => {

    let temp_file = path.join(temp_path, `${uuid.v4()}.ini`);

    await io.write_file(temp_file, await io.read_file(_file));
    return temp_file;
  }

  /**
  **/
  const iniedit_final = async (_file, _expect_file) => {

    let output = await io.read_file(_file);
    let expect = await io.read_file(_expect_file);

    output.should.equal(expect);
    return Promise.resolve();
  }

  /**
  **/
  const iniedit = async (_file, _args) => {

    let [ out ] = await util.run_process(
      iniedit_path, _args.concat([ '-f', _file ])
    );

    return await io.write_file(_file, out);
  }

  it('should be able to add INI sections', async () => {

    let out_file = path.join(fixtures_out, 'add-001.ini');
    let file = await iniedit_init(path.join(fixtures_in, 'add-001.ini'));

    await iniedit(file, [
      'add', '-t', '-s', 'Top', '-l', 'A=1', '-l', 'B =string'
    ]);

    await iniedit(file, [
      'add', '-s', 'Bottom', '-l', 'B= 2', '-c', '#=comment#='
    ]);

    await iniedit(file, [
      'add', '-t', '-s', 'Escape', '-l', 'Value = =Equals='
    ]);

    await iniedit_final(file, out_file);
    return await unlink(file);
  });

});

