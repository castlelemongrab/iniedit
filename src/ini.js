
let Base = require('./base');
let ini = require('@jedmao/ini-parser');
let IO = require('@castlelemongrab/ioh');

/**
**/
const Ini = class extends Base {

  /**
    Construct a new INI file parser/serializer. If `_string` is not null
    or undefined, call the `parse` method automatically upon construction.

    @arg _string {string|Buffer} - Contents of the INI file (optional)
    @arg _options {Object} - A dictionary of options for the INI parser
  */
  constructor (_string, _options) {

    super(_options);

    this._tree = null;
    this._parser = new ini.default();
    this._io = (this.options.io || new IO.Base());

    this.comment_prefix = '# ';
    this._parser.configure({ comment: /#/ });

    if (_string != null) {
      this.parse(_string);
    }

    return this;
  }

  /**
  **/
  get comment_prefix () {

    return this._comment_prefix;
  }

  /**
  **/
  set comment_prefix (_str) {

    this._comment_prefix = _str;
  }

  /**
    Parse an INI file and store its abstract syntax tree (AST) internally.
    To access the AST, use the `tree` method. This method returns `this`.
    @arg _string {string|Buffer} - Contents of the INI file (optional)
  */
  parse (_string) {

    this._tree = this._parser.parse(_string.toString()).items;
    let n = this.section_count;

    /* Remove trailing newline node */
    if (n > 0 && this.tree[n - 1].name === '') {
      this._tree.pop();
    }

    return this;
  }

  /**
    Retrieve the abstract syntax tree (AST) stored in this instance, or
    null if no INI file has been parsed yet.
  */
  get tree () {

    return this._tree;
  }

  /**
    Return the number of sections in the abstract syntax tree.
  */
  get section_count () {

    return (
      this._tree != null ? this._tree.length : null
    );
  }

  /**
    Print the contents of the potentially-modified abstract syntax tree
    (AST) as an INI file using the `emit` function, which defaults to
    standard output. The `emit` method may be overridden to provide
    alternative output types/destinations.
  */
  serialize () {

    for (let i = 0, ln1 = this._tree.length; i < ln1; ++i) {

      let section = this._tree[i];
      let nodes = (section.nodes || []);

      if (!(section instanceof ini.Section)) {
        continue;
      }

      if (section.name == '') {
        this.emit(''); continue;
      }

      this._emit_section(section.name);

      for (let j = 0, ln2 = nodes.length; j < ln2; ++j) {

        let node = nodes[j];

        if (node instanceof ini.Comment) {
          this._emit_comment(node.text.trim());
        } else if (node instanceof ini.Property) {
          this._emit_property(node.key, node.value);
        }
      }
    }
  }

  /**
    Return true if the criteria specified evaluate to an empty expression,
    false otherwise. This test allows for default-permissive behavior
    in addition to default-nonmatch behavior. For more information on
    the structure and format of these arguments, consult the documentation
    for the `transform_section` method.
  */
  is_empty_criteria (_sections, _where, _comment_where) {

    let where = (_where || []);
    let sections = (_sections || []);
    let comment_where = (_comment_where || []);

    return (
      (where.length + sections.length + comment_where.length) <= 0
    );
  }

  /**
    Transform the parsed INI file according to a set of rules.

    @arg _sections {Array} - An array of section names to which the
      transformation should apply. Values are case-sensitive section names
      and/or regular expressions. These are ORed together; any can match.
    @arg _where {Array} - An array of two-tuple (key/value pair) properties
      that must match in order for the the transformation to be applied.
      Both keys and values are case-sensitive, and may be strings or regular
      expressions. These matches are ANDed together; all clauses must match
      in order for a section to have a transformation applied.
    @arg _comment_where {Array} - An array of comment text to which the
      transformation should apply. Values are case-sensitive comment text
      and/or regular expressions. These are ANDed together; all must match.
    @arg _fn {Function} - The transformation function to be applied. The
      function's prototype is `fn(i, section, indicies)`, where `i` is the
      section offset in `this.tree`, `section` is the name of the section
      being transformed, and `indicies` are the zero-based offsets of all
      properties that were matched by the `_where` clause.
  */
  transform_section (_sections, _where, _comment_where, _fn) {

    let rv = 0;

    let where = (_where || []);
    let sections = (_sections || []);
    let comment_where = this._trim_strings(_comment_where || []);
    let matches_required = (where.length + comment_where.length);

    /* For each top-level node */
    for (let i = 0; i < this._tree.length; ++i) {

      let n = 0, m = 0;
      let section = this._tree[i];
      let section_nodes = (section.nodes || []);

      /* Match section */
      if (sections.length > 0 && !this._match_array(sections, section.name)) {
        continue;
      }

      /* Match properties and/or comments */
      for (let j = 0, ln2 = section_nodes.length; j < ln2; ++j) {

        let node = section_nodes[j];

        if (node instanceof ini.Property && where.length > 0) {
          if (m = this._match_pairs_array(where, [ node.key, node.value ])) {
            if (m === 2) { n++; }
          }
        } else if (m = node instanceof ini.Comment && comment_where.length) {
          if (m = this._match_array(comment_where, node.text.trim())) {
            n += m;
          }
        }
      }

      /* Check if clause is satisfied */
      if (n >= matches_required) {

        /* Increment section match count */
        rv++;

        /* Perform transform; break on false return value*/
        if (!_fn(i, section)) {
          break;
        }
      }
    }

    return rv;
  }

  /**
    Remove an INI file section that matches the `_sections`, `_where`,
    and `_comment_where` criteria. For more information on what these
    mean and how they are structured, see the `transform_section` method.
  */
  delete_section (_sections, _where, _comment_where) {

    return this.transform_section(
      _sections, _where, _comment_where,
        (_i) => !!this._tree.splice(_i, 1)
    );
  }

  /**
    Remove an INI file section that matches the `_sections`, `_where`,
    and `_comment_where` criteria. For more information on what these
    mean and how they are structured, see the `transform_section` method.
    This method is primarily intended to assist line-oriented utilities.
    @arg _names {Object} - A dictionary of property names; values are ignored
    @arg _comments {Boolean} - True to include all comments, false otherwise.
  */
  read_properties (_sections, _where, _comment_where, _names, _comments) {

    return this.transform_section(
      _sections, _where, _comment_where, (_i, _section) => {

        let nodes = _section.nodes;

        for (let j = 0, len = nodes.length; j < len; ++j) {

          let node = nodes[j];

          if (node instanceof ini.Property) {
            if (_names[node.key] != null) {
              this.emit(node.value);
            }
          } else if (_comments && node instanceof ini.Comment) {
              this._emit_comment(node.text.trim());
          }
        }

        return true;
      }
    );
  }

  /**
    Modify a section of the current INI file that matches the `_sections`,
    `_where`, and `_comment_where` criteria. For more information on what
    these mean and how they're structured, consult `transform_section`.

    @arg _properties {Object} - A dictionary of properties to add or replace
      should the where clause criteria match. If a property value is exactly
      equal to `null`, the property is removed from the INI file.
    @arg _comments {Object} - A dictionary of trimmed comments to add or
      replace should the where clause criteria match. Values are always
      ignored, unless the value is strictly equal to `null`, in which case
      the comment is removed from the INI file section.
    @arg _name {String} - Optional. If `_name` is not null or undefined,
      replace the matched section's name with `_name`.
  */
  modify_section (_sections, _where,
                  _comment_where, _properties, _comments, _name) {

    let comments = (_comments || {});
    let properties = (_properties || {});

    return this.transform_section(
      _sections, _where, _comment_where, (_i, _ini_section) => {

        let new_comments = [];
        let visited_properties = {};
        let nodes = (_ini_section.nodes || []);

        /* Modify section name */
        if (_name != null) {
          _ini_section.name = _name;
        }

        /* Modify properties */
        for (let i = 0, len = nodes.length; i < len; ++i) {

          let node = nodes[i];

          if (node instanceof ini.Property) {
            if (properties[node.key] != null) {
              /* Replace property */
              visited_properties[node.key] = true;
              node.value = properties[node.key];
            } else if (properties[node.key] === null) {
              /* Delete property */
              nodes.splice(i, 1); --i;
            }
          } else if (node instanceof ini.Comment) {
            if (comments[node.text.trim()] === null) {
              /* Delete comment */
              nodes.splice(i, 1); --i;
            }
          }
        }

        /* Append new properties */
        for (let k in properties) {
          if (visited_properties[k] == null && properties[k] !== null) {
            /* Add property */
            let p = new ini.Property(k);
            p.delimiter = '='; p.value = properties[k];
            nodes.push(p);
          }
        }

        /* Build new comments */
        for (let k in comments) {
          if (comments[k] !== null) {
            new_comments.push(
              new ini.Comment(this.comment_prefix, k)
            );
          }
        }

        /* Prepend new comments */
        for (let i = new_comments.length; i > 0; --i) {
          nodes.unshift(new_comments[i - 1]);
        }

        return true;
      }
    );
  }

  /**
    Add a new section to the parsed INI file.

    @arg _name {String} - The name of the section to add
    @arg _properties {Object} - A key/value dictionary of section properties
    @arg _comments {Array} - An array of section comment strings to prepend
    @arg _should_prepend {boolean} - True if the new section should be first
  */
  add_section (_name, _properties, _comments,
               _should_prepend, _sections, _where, _comment_where) {

    let comments = (_comments || []);
    let properties = (_properties || {});

    /* Perform optional match predicate */
    let n = this.transform_section(
      _sections, _where, _comment_where, () => false
    );

    let does_match = (
      (n > 0) || this.is_empty_criteria(
        _sections, _where, _comment_where
      )
    );

    if (!does_match) {
      return 0;
    }

    let ini_section = new ini.Section();
    ini_section.name = (_name || '');

    /* Append comments */
    for (let i = 0, len = comments.length; i < len; ++i) {
      ini_section.nodes.push(new ini.Comment(
        this._comment_prefix, comments[i].toString()
      ));
    }

    /* Append properties */
    for (let k in properties) {
      if (properties[k] !== null) {
        let p = new ini.Property(k);
        p.delimiter = '='; p.value = properties[k];
        ini_section.nodes.push(p);
      }
    }

    if (_should_prepend) {
      this._tree.unshift(ini_section);
    } else {
      this._tree.push(ini_section);
    }

    return 1;
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

  /**
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

  /**
    Emit a string to the output medium of your choice. The default
    implementation uses the Javascript console, but you can use the
    `IOH` class and the `io` constructor option to override this.
  */
  emit (_str) {

    this._io.stdout(`${_str}\n`);
    return this;
  }

  /**
  */
  _emit_section (_str) {

    this.emit(`[${_str.replace(/(\[|\])/g, '\\$1')}]`);
    return this;
  }

  /**
  */
  _emit_comment (_str) {

    this.emit(`${this.comment_prefix}${_str}`);
    return this;
  }

  /**
  */
  _emit_property (_key, _value) {

    let key = this._escape_equals(_key);
    this.emit(`${key} = ${_value}`);
  }

  /**
  */
  _escape_equals (_str) {

    return _str.replace('\\', '\\\\').replace('=', '\\=');
  }
};

/* Export symbols */
module.exports = Ini;

