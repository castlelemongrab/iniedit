
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

    let expect_file = path.join(fixtures_out, 'add-001.ini');
    let file = await iniedit_init(path.join(fixtures_in, 'add-001.ini'));

    await iniedit(file, [
      'add',
        '-t', '-s', 'Top', '-l', 'A=1', '-l', 'B =string'
    ]);

    await iniedit(file, [
      'add', '-r',
        '-s', 'Bottom', '-l', 'B= 2', '-c', '#=comment#='
    ]);

    await iniedit(file, [
      'add', '-r',
        '-x', 'Bottom', '-n', ' B=2 ', '-m', '#=com+ent#=',
        '-s', 'Rematch', '-l', 'A=1'
    ]);

    await iniedit(file, [
      'add', '-t',
        '-s', 'Escape', '-l', 'Value = =Equals='
    ]);

    await iniedit(file, [
      'add', '-x', 'Void', '-l', 'Value=0',
        '-s', 'Void'
    ]);

    await iniedit(file, [
      'add', '-x', 'Void', '-l', 'Value=1',
        '-s', 'Void', '-n', 'Void=1'
    ]);

    await iniedit(file, [
      'add', '-x', 'Void', '-l', 'Value=2',
        '-s', 'Void', '-m', 'Void'
    ]);

    await iniedit(file, [
      'add', '-x', 'Void', '-l', 'Value=3',
        '-s', 'Void', '-n', 'Void=1', '-m', 'Void'
    ]);

    await iniedit_final(file, expect_file);
    return await unlink(file);
  });

  it('should be able to delete INI sections', async () => {

    let expect_file = path.join(fixtures_out, 'delete-001.ini');
    let file = await iniedit_init(path.join(fixtures_in, 'delete-001.ini'));

    await iniedit(file, [
      'delete', '-x', 'B'
    ]);

    await iniedit(file, [
      'delete', '-x', 'W', '-x', 'WW'
    ]);

    await iniedit(file, [
      'delete', '-x', 'X', '-x', 'XX',
        '-n', 'A =1', '-n', ' B= 2 '
    ]);

    await iniedit(file, [
      'delete', '-r', '-x', '^Y', '-x', '^YY', '-x', '^YY+'
    ]);

    await iniedit(file, [
      'delete', '-r', '-x', '^Z', '-x', '^ZZ$', '-x', 'ZZ+$',
        '-n', 'A=st?r?', '-m', '^C+'
    ]);

    await iniedit(file, [
      'delete', '-m', 'remove'
    ]);

    await iniedit(file, [
      'delete', '-n', 'Foo = Remove'
    ]);

    await iniedit(file, [
      'delete', '-r', '-n', 'Dele?t?e?$=.*', '-m', 'regexp propert(y|(ies+))'
    ]);

    await iniedit(file, [
      'delete', '-r', '-x', 'D', '-n', 'Baz=N?o?Remo+ve'
    ]);

    await iniedit(file, [
      'delete', '-m', '  Comment  '
    ]);

    await iniedit_final(file, expect_file);
    return await unlink(file);
  });

  it('should be able to modify INI sections', async () => {

    let expect_file = path.join(fixtures_out, 'modify-001.ini');
    let file = await iniedit_init(path.join(fixtures_in, 'modify-001.ini'));

    await iniedit(file, [
      'modify',
        '-x', 'A', '-n', ' A = B ',
        '-l', ' C= D '
    ]);

    await iniedit(file, [
      'modify',
        '-x', 'B', '-m', 'Comment',
        '-d', 'A', '-o', 'Comment', '-l', 'C=2'
    ]);

    await iniedit(file, [
      'modify', '-r', '-n', 'Unique=D', '-n', 'E=F',
        '-d', 'Unique', '-l', 'A=1', '-l', 'E=3 ', '-c', 'Comment'
    ]);

    await iniedit(file, [
      'modify', '-r',
        '-n', 'A{1,3}=X', '-n', 'C=Y', '-n', 'E=ZZ*', '-m', '^Add',
        '-d', 'A', '-l', 'Added=1', '-c', 'Modified'
    ]);

    await iniedit(file, [
      'modify', '-r',
        '-x', 'E{1,2}', '-n', 'A+B*=\\w', '-m', '^E+',
        '-l', 'C=1', '-o', 'EE', '-c', 'E'
    ]);

    await iniedit(file, [
      'modify',
        '-x', 'Multiple',
        '-d', 'A', '-d', 'C'
    ]);

    await iniedit(file, [
      'modify', '-r',
        '-n', 'Multi.*=Multi.*',
        '-l', 'A =A', '-l', 'Multiple=1', '-l', 'X=XX',
        '-d', 'Multi', '-e', 'X'
    ]);

    await iniedit(file, [
      'modify',
        '-x', 'Rename', '-e', 'Renamed Section'
    ]);

    await iniedit_final(file, expect_file);
    return await unlink(file);
  });

});

