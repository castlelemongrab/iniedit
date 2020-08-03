
'use strict';

const chai = require('chai');
const Ini = require('../src/ini');
const util = require('./include/util');
const promises = require('chai-as-promised');
const factories = require('chai-js-factories');

/**
 */
describe('basic', () => {

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

});

