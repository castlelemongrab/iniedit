
'use strict';

const chai = require('chai');
const Ini = require('../src/ini');
const util = require('./include/util');
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

    let i = chai.factory.create(
      'fixture', { type: 'input', name: 'add-001' }
    );
    let o = chai.factory.create(
      'fixture', { type: 'output', name: 'add-001' }
    );

    let io = new IO.NodePlug();
    let ini = new Ini(i, { io: io });

    ini.add_section('Top', { A: 1, B: 'string' }, [], true);
    ini.add_section('Bottom', { A: null, B: 2 }, [ '#=comment#=' ]);
    ini.add_section('Escape', { Value: '=Equals=' }, [], true);

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });

  it('should be able to delete INI sections', () => {

    let i = chai.factory.create(
      'fixture', { type: 'input', name: 'delete-001' }
    );
    let o = chai.factory.create(
      'fixture', { type: 'output', name: 'delete-001' }
    );

    let io = new IO.NodePlug();
    let ini = new Ini(i, { io: io });

    ini.delete_section([], [], [ 'remove' ]);
    ini.delete_section([ 'B' ]);
    ini.delete_section([], [['Foo', 'Remove' ]]);
    ini.delete_section([ 'D' ], [['Baz', /N?o?Remo+ve/ ]]);
    ini.delete_section([], [[/^Dele?t?e?$/ ]], [ /^regexp propert(y|(ies+))/ ]);

    ini.serialize();
    expect(io.toString()).to.equal(o);
  });
});

