
let fs = require('fs');
let path = require('path');

const define_factories = (_chai) => {

  _chai.factory.define('fixture', function (_args) {

    return fs.readFileSync(path.join(
      __dirname, '..', 'fixtures', _args.type,
        `${path.basename(_args.name, '.ini')}.ini`
    )).toString();
  });

  return _chai;
};

module.exports = {
  define_factories: define_factories
};

