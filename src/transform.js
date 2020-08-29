
'use strict';

let Base = require('./base');
let Query = require('./query');
let ini = require('@jedmao/ini-parser');

/**
**/
const Transform = class extends Base {

  /**
    @arg _tree {Array} - The abstract syntax tree to operate on
  */
  constructor (_tree, _options) {

    super(_options);

    this.tree = _tree;
    return this;
  }

  /**
  */
  set tree (_tree) {

    this._tree = (_tree || []);
  }

  /**
  */
  get tree () {

    return this._tree;
  }

  /**
    Match and/or transform a parsed INI abstract syntax tree according to
    a set of caller-specified rules.

    @arg _q {Query} - An `ini.query` object describing how to match sections.
    @arg _fn {Function} - The transformation function to be applied. The
      function's prototype is `fn(i, section, indicies)`, where `i` is the
      section offset in `this.tree`, `section` is the name of the section
      being transformed, and `indicies` are the zero-based offsets of all
      properties that were matched by the `_where` clause.
  */
  run (_q, _fn) {

    let rv = 0;
    let tree = this._tree;
    let matches_required = (_q.where.length + _q.comments.length);

    /* For each top-level node */
    for (let i = 0; i < tree.length; ++i) {

      let matches_found = 0;
      let nodes = (tree[i].nodes || []);

      /* Skip non-matching section names */
      if (_q.sections.length > 0) {
        if (!this._match_array(_q.sections, tree[i].name)) {
          continue;
        }
      }

      /* Match properties and comments */
      for (let j = 0; j < nodes.length; ++j) {

        let n = nodes[j];

        if (n instanceof ini.Property) {
          if (this._match_pairs_array(_q.where, [ n.key, n.value ]) === 2) {
            matches_found++;
          }
        } else if (n instanceof ini.Comment) {
          matches_found += this._match_array(_q.comments, n.text.trim());
        }
      }

      /* Check if we have a match */
      if (matches_found >= matches_required) {

        /* Update statistics:
            This must occur first; we guarantee to the callback that
            we've already recorded and accounted for the section match. */

        rv++;

        /* Perform transformation;
            Allow the caller to freely transform a matching section or
            any portion of the abstract syntax tree that can be reached. */

        if (!_fn(i, tree[i])) {
          break;
        }
      }
    }

    return rv;
  }

  /**
    Compare `_lhs` and `_rhs` to each other, either as regular
    expressions or strings. Returns null if asked to compare a
    regular expression to another regular expression.
    @arg _lhs {String|RegExp} - The value to match against `_lhs`
    @arg _rhs {String|RegExp} - The value to match against `_rhs`
  */
  _match_generic (_lhs, _rhs) {

    if (_lhs instanceof RegExp && _rhs instanceof RegExp) {
      return null;
    }

    if (_lhs instanceof RegExp) {
      return !!_rhs.toString().match(_lhs);
    }

    if (_rhs instanceof RegExp) {
      return !!_lhs.toString().match(_rhs);
    }

    return (_lhs.toString() === _rhs.toString());
  }

  /**
  */
  _match_array (_a, _rhs) {

    let n = 0;

    for (let i = 0, len = _a.length; i < len; ++i) {
      if (this._match_generic(_a[i], _rhs)) {
        n++;
      }
    }

    return n;
  }

  /**
  */
  _match_pairs_array (_pairs, _tuple) {

    let n = 0;

    for (let i = 0, ln1 = _pairs.length; i < ln1; ++i) {
      for (let j = 0; j < _tuple.length; ++j) {

        let is_match = (
          _pairs[i][j] == null ||
            this._match_generic(_pairs[i][j], _tuple[j])
        );

        if (is_match) {
          n++;
        }
      }
    }

    return n;
  }
};

/* Export symbols */
module.exports = Transform;

