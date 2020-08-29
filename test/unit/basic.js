
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
      'fixture', { type: 'input', name: 'test-001' }
    );

    str.should.be.a.string;
    str.length.should.be.gt(0);
  });

  it('should be able to add INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'add-001');

    ini.add_section(
      'Bottom', { A: null, B: 2 }, [ '#=comment#=' ]
    );

    ini.add_section(
      'Rematch', { A: 1 }, [], false,
        new Ini.Query([ 'Bottom' ], [[ 'B', '2' ]], [ /#=com+ent#=/ ])
    );

    ini.add_section('Top', { A: 1, B: 'string' }, [], true);

    ini.add_section(
      'Escape', { Value: '=Equals=' }, [], true,
        new Ini.Query([], [], [])
    );

    ini.add_section(
      'Void', { Value: 0 }, [], true,
        new Ini.Query([ 'Void' ], [])
    );

    ini.add_section(
      'Void', { Value: 1 }, [], true,
        new Ini.Query([], [[ 'Void', 1 ]], [])
    );

    ini.add_section(
      'Void', { Value: 2 }, [], true,
        new Ini.Query([], [], [ 'Void' ])
    );

    ini.add_section(
      'Void', { Value: 3 }, [], true,
        new Ini.Query([ 'Void' ], [[ 'Void', 1 ]], [ 'Void' ])
    );

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });

  it('should be able to delete INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'delete-001');

    ini.delete_section(new Ini.Query([ 'B' ]));
    ini.delete_section(new Ini.Query([ 'W', 'WW' ]));
    ini.delete_section(new Ini.Query([ 'X', 'XX' ], [[ 'A', 1 ], [ 'B', 2 ]]));
    ini.delete_section(new Ini.Query([ 'Y', 'YY', /YY+/ ]));

    ini.delete_section(
      new Ini.Query([ 'Z', /ZZ+$/ ], [[ 'A', /st?r?/ ]], [ /^C+.*C?$/ ])
    );

    ini.delete_section(new Ini.Query([], [], [ 'remove' ]));
    ini.delete_section(new Ini.Query([], [['Foo', 'Remove' ]]));

    ini.delete_section(
      new Ini.Query([], [[ /^Dele?t?e?$/, /.*/ ]], [ /^regexp propert(y|(ies+))/ ])
    );

    ini.delete_section(new Ini.Query([ 'D' ], [['Baz', /N?o?Remo+ve/ ]]));
    ini.delete_section(new Ini.Query([], [], [ '  Comment  ' ]));

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });


  it('should be able to modify INI sections', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'modify-001');

    ini.modify_section(
      new Ini.Query([ 'A' ], [[ 'A', 'B' ]], []),
        { C: 'D' }
    );

    ini.modify_section(
      new Ini.Query([ 'B' ], [], [ 'Comment' ]),
        { A: null, C: 2 }, { Comment: null }
    );

    ini.modify_section(
      new Ini.Query([], [[ 'Unique', /D/ ], [ 'E', 'F' ]], []),
        { A: 1, E: 3, Unique: null }, { Comment: true }
    );

    ini.modify_section(
      new Ini.Query(
        [], [[ /A{1,3}/, 'X' ], [ 'C', 'Y' ], [ 'E', /ZZ*/ ]], [ /^Add/ ]
      ), { A: null, Added: 1 }, { Modified: true }
    );

    ini.modify_section(
      new Ini.Query([ /E{1,2}/ ], [[ /A+B*/, /\w/ ]], [ /E+/ ]),
        { C: 1 }, { EE: null, E: 1 }
    );

    ini.modify_section(
      new Ini.Query([ 'Multiple' ], [], []),
        { A: null, C: null }
    );

    ini.modify_section(
      new Ini.Query([], [[ /Multi.*/, /Multi.*/ ]], []),
        { A: 'A', X: 'XX', Multiple: 1, Multi: null }, {}, 'X'
    );

    ini.modify_section(
      new Ini.Query([ 'Rename' ], [], []),
        {}, {}, 'Renamed Section'
    );


    ini.serialize();
    expect(io.toString()).to.equal(o);
  });


  it('should be able to read INI properties', () => {

    let [ ini, io, o, i ] = util.init_fixture_test(chai, 'read-001');

    ini.read_properties(
      new Ini.Query([], [], []), { Key: true }, false
    );

    expect(io.toString()).to.equal(o);
  });


});

