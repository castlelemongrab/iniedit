// ✊🏿

'use strict';

let Base = require('./base');
let Query = require('./query');
let Transform = require('./transform');
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
    this._transform = null;
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
    this._transform = new Transform(this._tree);

    let size = this.size;

    /* Remove trailing newline node */
    if (size > 0 && this.tree[size - 1].name === '') {
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
  get size () {

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
    Remove an INI file section that matches the `_sections`, `_where`,
    and `_comment_where` criteria. For more information on what these
    mean and how they are structured, see the `transform_section` method.
  */
  delete_section (_query) {

    return this._transform.run(
      _query, (_i) => !!this._tree.splice(_i, 1)
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
  read_properties (_query, _names, _comments) {

    return this._transform.run(_query, (_i, _section) => {

      let nodes = (_section.nodes || []);

      for (let j = 0, len = nodes.length; j < len; ++j) {

        let n = nodes[j];

        if (n instanceof ini.Property) {
          if (_names[n.key] != null) {
            this.emit(n.value);
          }
        } else if (_comments && n instanceof ini.Comment) {
            this._emit_comment(n.text.trim());
        }
      }

      return true;
    });
  }

  /**
    Modify a section of the current INI file.

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
  modify_section (_query, _properties, _comments, _name) {

    let comments = (_comments || {});
    let properties = (_properties || {});

    return this._transform.run(_query, (_i, _ini_section) => {

        let new_comments = [];
        let visited_properties = {};
        let nodes = (_ini_section.nodes || []);

        /* Modify section name */
        if (_name != null) {
          _ini_section.name = _name;
        }

        /* Modify properties */
        for (let i = 0, len = nodes.length; i < len; ++i) {

          let n = nodes[i];

          if (n instanceof ini.Property) {
            if (properties[n.key] != null) {
              /* Replace property */
              visited_properties[n.key] = true;
              nodes[i].value = properties[n.key];
            } else if (properties[n.key] === null) {
              /* Delete property */
              nodes.splice(i, 1); --i;
            }
          } else if (n instanceof ini.Comment) {
            if (comments[n.text.trim()] === null) {
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

        /* Instansiate new comments */
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
  add_section (_name, _properties, _comments, _should_prepend, _query) {

    let comments = (_comments || []);
    let properties = (_properties || {});

    let query = (_query || new Query());

    /* Match predicate if specified */
    if (!query.is_empty() && !this._transform.run(query, () => false)) {
      return 0;
    }

    /* Append comments */
    let ini_section = new ini.Section();
    ini_section.name = (_name || '');

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

