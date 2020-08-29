
'use strict';

let Base = require('./base');

/**
**/
const Query = class extends Base {

  /**
    @arg _sections {Array} - If specified, assign `sections` on creation.
    @arg _where {Array} - If specified, assign `where` on creation.
    @arg _comments {Array} - If specified, assign `comments` on creation.
  */
  constructor (_sections, _where, _comments, _options) {

    super(_options);

    /* Query criteria */
    this.sections = _sections;
    this.where = _where;
    this.comments = _comments;

    return this;
  }

  /**
  **/
  get sections () {

    return this._sections;
  }

  /**
    Set the list of matching section names.

    @arg _sections {Array} - An array of strings or regular expressions
      to match against INI file section names. Values are case-sensitive.
      Specifying more than one value is an OR operation; if any individual
      item matches, the section matches.
  **/
  set sections (_sections) {

    return this._sections = (_sections || []);
  }

  /**
  **/
  get where () {

    return this._where;
  }

  /**
    Set the list of matching section key/value pairs.

    @arg _where {Array} - An array of two-tuple (key/value) pairs that
      must match within a section in order for the section itself to match.
      Keys and values are all case-sensitive; values may be strings or regular
      expressions. Specifying more than one two-tuple is an AND operation;
      all clauses must match simultaneously in order for a section to match.
  **/
  set where (_where) {

    return this._where = (_where || []);
  }

  /**
  **/
  get comments () {

    return this._comments;
  }

  /**
    Set the list of matching section comment strings.

    @arg _comments {Array} - An array of comment strings that must appear
      within a section in order for the section itself to match. Values are
      case-sensitive, and may be strings or regular expressions. Specifying
      more than one value is currently an AND operation; all strings must
      appear in the section as individual comments in order to match.
  **/
  set comments (_comments) {

    return this._comments = this._trim_strings(_comments || []);
  }

  is_empty () {

    return (
      (this.sections.length + this.where.length + this.comments.length) <= 0
    );
  }

  /**
    For every string in the array `_strings`, trim any preceding or trailing
    whitespace from the string. Modify `_strings` in-place, and return it.
  */
  _trim_strings (_strings) {

    let rv = _strings;

    for (var i = 0, len = rv.length; i < len; ++i) {
      if (typeof rv[i] === 'string') {
        rv[i] = rv[i].trim();
      }
    }

    return rv;
  }
};

/* Export symbols */
module.exports = Query;

