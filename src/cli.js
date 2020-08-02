// ✊🏿

'use strict';

const Ini = require('./ini');
const Base = require('./base');
const Oath = require('./oath');
const Arguments = require('./arguments');
const Strr = require('@castlelemongrab/strr');

/**
  The command-line interface to Parlance.
  @extends Base
**/
const CLI = class extends Base {

  /**
   */
  constructor (_options) {

    super(_options);

    /* Probably not the best idea */
    this._fs = require('fs');
    this._process = require('process');
    this._line_factory = Oath.promisify(require('line-reader').open);

    this._lines = null;
    this._ini = new Ini();
    this._args = new Arguments();

    return this;
  }

  /**
   */
  async run () {

    let args = this._args.parse();
    this._validate_args(args);

    try {
      this._ini.parse(this._fs.readFileSync(args.f));
    } catch (_e) {
      this._fatal(`Unable to parse file '${args.f}`, _e);
    }

    let rv = await this._run_command(args);
    this._ini.serialize();

    return true;
  }

  /**
   */
  _validate_args (_args) {

    switch (_args._[0]) {
      case 'delete':
        if (_args.x == null && _args.n == null && _args.m == null) {
          this._fatal('No modification criteria specified');
        }
        break;
      case 'modify':
        if (_args.l == null && _args.c == null && _args.d == null) {
          this._fatal('No modification operations specified');
        }
      default:
        break;
    }

    return this;
  }

  /**
   */
  async _run_command (_args) {

    switch (_args._[0]) {
      case 'add':
        let lines = await this._hash_tuple_array(_args.l);
        this._ini.add_section(
          _args.s,
            await this._hash_tuple_array(_args.l), (_args.c || [])
        );
        break;
      case 'delete':
        this._ini.delete_section(
          _args.x, await this._hash_tuple_array(_args.n),
            this._hash_boolean_array(_args.m)
        );
        break;
      case 'modify':
        this._ini.modify_section(
          _args.x, await this._hash_tuple_array(_args.n),
            this._hash_boolean_array(_args.m),
            await this._hash_tuple_array(_args.l),
            this._hash_boolean_array(_args.c)

        );
        break;
    }

    return this;
  }

  /**
   */
  async _hash_tuple_array (_array) {

    let rv = {};
    let array = (_array || []);

    for (let i = 0, len = array.length; i < len; ++i) {
      let tuple = Strr.split_delimited(array[i], '=', '\\', true, 2);

      if (tuple.length === 1) {
        await this._lazy_open_lines();
        if (!this._lines.hasNextLine()) {
          throw Error('Unexpected end of input');
        }
        let next_line = Oath.promisify(this._lines.nextLine);
        tuple.push(await next_line());
      } else if (tuple.length != 2) {
        this._fatal('Malformed key/value input');
      }

      rv[tuple[0]] = tuple[1];
    }

    return Promise.resolve(rv);
  }

  /**
   */
  _hash_boolean_array (_array) {

    let rv = {};
    let array = (_array || []);

    for (let i = 0, len = array.length; i < len; ++i) {
      rv[array[i]] = true;
    }

    return rv;
  }

  /**
   */
  async _lazy_open_lines () {

    if (this._lines) {
      return this._lines;
    }

    return (
      (this._lines = await this._line_factory(this._process.stdin))
    );
  }

  /**
   */
  _fatal (_str, _err_extra) {

    this._process.stderr.write(`[fatal] ${_str}\n`);
    this._process.exit(127);
  }

};

/* Export symbols */
module.exports = CLI;

