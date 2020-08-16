// ✊🏿

'use strict';

const Ini = require('./ini');
const Base = require('./base');
const jsdump = require('jsDump');
const process = require('process');
const Arguments = require('./arguments');
const IO = require('@castlelemongrab/ioh');
const Strr = require('@castlelemongrab/strr');
const Oath = require('@castlelemongrab/oath');

/**
  @extends Base
**/
const CLI = class extends Base {

  /**
   */
  constructor (_options) {

    super(_options);

    this._line_factory = Oath.promisify(require('line-reader').open);
    return this.reset();
  }

  /**
   */
  reset (_options) {

    this._ini = new Ini();
    this._args = new Arguments();
    this._io = (this.options.io || new IO.Node());

    this._lines = null;
    this._next_line = null;

    return this;
  }

  /**
   */
  async run () {

    let args;

    try {

      args = this._args.parse();
      this._validate_args(args);

      try {
        this._ini.parse(await this._io.read_file(args.f));
      } catch (_e) {
        this._fatal(`Unable to parse file '${args.f}'`, _e);
      }

      let rv = await this._run_command(args);

      /* If output is actually intended to be an INI file... */
      if (args._[0] !== 'read') {
        this._ini.serialize();
      }

    } catch (_e) {

      if (args.v) {
        this._io.warn('Error; stack trace is starting');
        console.debug(_e);
      }

      this._io.fatal('A fatal internal error occurred, use -v for details');
    }

    return true;
  }

  /**
   */
  _validate_args (_args) {

    let is_valid = true;

    switch (_args._[0]) {
      case 'read':
        is_valid = (
          _args.l != null || _args.c != null
        );
        break;
      case 'delete':
        is_valid = (
          _args.x != null || _args.n != null || _args.m != null
        );
        break;
      case 'modify':
        is_valid = (
          _args.l != null || _args.c != null ||
            _args.d != null || _args.o != null || _args.e != null
        );
        break;
      default:
        break;
    }

    if (!is_valid) {
      this._fatal('No operations specified');
    }

    return this;
  }

  /**
   */
  async _run_command (_args) {

    let rv = 0;

    /* Regexp support */
    try {
      _args = this._convert_regexp_args(_args);
    } catch (_e) {
      this._io.fatal(_e.message);
    }

    /* Translate to API */
    switch (_args._[0]) {
      case 'read':
        rv = this._ini.read_properties(
          _args.x, await this._create_tuple_array(_args.n, _args.r), _args.m,
            this._create_boolean_hash(_args.l), _args.c
        );
        break;
      case 'add':
        rv = this._ini.add_section(
          _args.s, await this._create_tuple_hash(_args.l), _args.c, _args.t,
            _args.x, await this._create_tuple_array(_args.n, _args.r), _args.m
        );
        break;
      case 'delete':
        rv = this._ini.delete_section(
          _args.x, await this._create_tuple_array(_args.n, _args.r), _args.m
        );
        break;
      case 'modify':
        rv = this._ini.modify_section(
          _args.x,
          await this._create_tuple_array(_args.n, _args.r),
          _args.m,
          this._add_hash_nulls(
            await this._create_tuple_hash(_args.l), _args.d
          ),
          this._add_hash_nulls(
            this._create_boolean_hash(_args.c), _args.o
          ),
          _args.e
        );
        break;
    }

    return rv;
  }

  /**
   */
  _convert_regexp_args (_args) {

    _args.x = this._create_regexp_array_if(_args.x, _args.r);
    _args.m = this._create_regexp_array_if(_args.m, _args.r);

    return _args;
  }

  /**
   */
  async _split_or_read_line (_str) {

    let tuple = Strr.split_delimited(_str, '=', '\\', true, 2);

    if (tuple.length === 1) {
      await this._lazy_open_lines();
      if (!this._lines.hasNextLine()) {
        throw Error('Unexpected end of input');
      }
      tuple.push(await this._next_line());
    } else if (tuple.length != 2) {
      throw new Error('Malformed key/value input');
    }

    return Promise.resolve(tuple);
  }

  /**
   */
  async _lazy_open_lines () {

    if (this._lines) {
      return this._lines;
    }

    this._lines = await this._line_factory(process.stdin);
    this._next_line = Oath.promisify(this._lines.nextLine);

    return this;
  }
  /**
   */
  _create_boolean_hash (_array) {

    let rv = {};
    let array = (_array || []);

    for (let i = 0, len = array.length; i < len; ++i) {
      rv[_array[i]] = true;
    }

    return rv;
  }

  /**
   */
  async _create_tuple_hash (_array, _is_regexp, _no_stdin) {

    let rv = {};
    let array = (_array || []);

    for (let i = 0, len = array.length; i < len; ++i) {

      let tuple = (
        _no_stdin ? array[i] :
          await this._split_or_read_line(array[i])
      );

      let k = this._create_regexp_if(tuple[0], false);
      rv[k] = this._create_regexp_if(tuple[1], _is_regexp);
    }

    return Promise.resolve(rv);
  }

  /**
   */
  async _create_tuple_array (_array, _is_regexp, _no_stdin) {

    let rv = [];
    let array = (_array || []);

    for (let i = 0, len = array.length; i < len; ++i) {

      let tuple = (
        _no_stdin ? array[i] :
          await this._split_or_read_line(array[i])
      );

      rv.push([
        this._create_regexp_if(tuple[0], _is_regexp),
        this._create_regexp_if(tuple[1], _is_regexp)
      ]);
    }

    return Promise.resolve(rv);
  }

  /**
   */
  _add_hash_nulls (_hash, _key_array) {

    let rv = _hash;

    if (_key_array == null) {
      return rv;
    }

    for (let i = 0, len = _key_array.length; i < len; ++i) {
      rv[_key_array[i]] = null;
    }

    return rv;
  }

  /**
   */
  _create_regexp_if (_str, _is_regexp, _regexp_flags) {

    let rv = _str.toString();

    if (_is_regexp) {
      try {
        rv = new RegExp(rv, (_regexp_flags || 'g'));
      } catch (_e) {
        throw new Error(`Invalid regular expression /${rv}/`);
      }
    }

    return rv;
  }

  /**
   */
  _create_regexp_array_if (_a, _is_regexp, _regexp_flags) {

    let rv = _a;

    if (rv == null) {
      return rv;
    }

    for (let i = 0, len = rv.length; i < len; ++i) {
      rv[i] = this._create_regexp_if(rv[i], _is_regexp, _regexp_flags);
    }

    return rv;
  }


  /**
   */
  _fatal (_str, _err_extra) {

    this._io.fatal(_str);
  }
};

/* Export symbols */
module.exports = CLI;

