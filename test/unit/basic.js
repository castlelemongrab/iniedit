
'use strict';

const chai = require('chai');
const Ini = require('../../src/ini');
const util = require('../include/util');
const IO = require('@castlelemongrab/ioh');
const promises = require('chai-as-promised');
const factories = require('chai-js-factories');

/**
 */
describe('basic', () => {

  let expect = chai.expect;
  let should = chai.should();

  chai.use(promises);
  chai.use(factories);
  util.define_factories(chai);

  it('should be able to read a fixture', () => {

    let str = chai.factory.create(
      'fixture', { type: 'input', name: 'test' }
    );

    str.should.be.a.string;
    str.length.should.be.gt(0);
  });

  it('should be able to add INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'add-001');

    ini.add_section('Top', { A: 1, B: 'string' }, [], true);
    ini.add_section('Bottom', { A: null, B: 2 }, [ '#=comment#=' ]);
    ini.add_section('Escape', { Value: '=Equals=' }, [], true);

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });

  it('should be able to delete INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'delete-001');

    ini.delete_section([ 'B' ]);
    ini.delete_section([ 'W', 'WW' ]);
    ini.delete_section([ 'X', 'XX' ], [[ 'A', 1 ], [ 'B', 2 ]]);
    ini.delete_section([ 'Y', 'YY', /YY+/ ]);
    ini.delete_section([ 'Z', /ZZ+$/ ], [[ 'A', /st?r?/ ]], [ /^C+.*C?$/ ]);
    ini.delete_section([], [], [ 'remove' ]);
    ini.delete_section([], [['Foo', 'Remove' ]]);
    ini.delete_section([], [[/^Dele?t?e?$/ ]], [ /^regexp propert(y|(ies+))/ ]);
    ini.delete_section([ 'D' ], [['Baz', /N?o?Remo+ve/ ]]);

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });


  it('should be able to modify INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'modify-001');

    ini.modify_section(
      [ 'A' ], [[ 'A', 'B' ]], [],
        { C: 'D' }
    );

    ini.modify_section(
      [ 'B' ], [], [ 'Comment' ],
        { A: null, C: 2 }, { Comment: null }
    );

    ini.modify_section(
      [], [[ 'Unique', /D/ ], [ 'E', 'F' ]], [],
        { A: 1, E: 3, Unique: null }, { Comment: true }
    );

    ini.modify_section(
      [], [[ /A{1,3}/, 'X' ], [ 'C', 'Y' ], [ 'E', 'ZZ*' ]], [ /^Add/ ],
        { A: null, Added: 1 }, { Modified: true }
    );

    ini.modify_section(
      [ /E{1,2}/ ], [[ /A+B*/, /\w/ ]], [ /E+/ ],
        { C: 1 }, { EE: null, E: 1 }
    );

    ini.modify_section(
      [ 'Multiple' ], [], [],
        { A: null, C: null }
    );

    ini.modify_section(
      [], [[ /Multi.*/, /Multi.*/ ]], [],
        { A: 'A', X: 'XX', Multiple: 1, Multi: null }, {}, 'X'
    );

    ini.modify_section(
      [ 'Rename' ], [], [],
        {}, {}, 'Renamed Section'
    );


    ini.serialize();
    expect(io.toString()).to.equal(o);
  });

});

