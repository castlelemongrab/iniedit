
let Base = require('./base');
let ini = require('@jedmao/ini-parser');

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
    this._comment_char = '#';
    this._parser = new ini.default();
    this._parser.configure({ comment: new RegExp(this._comment_char) });

    if (_string != null) {
      this.parse(_string);
    }

    return this;
  }

  /**
    Parse an INI file and store its abstract syntax tree (AST) internally.
    To access the AST, use the `tree` method. This method returns `this`.
    @arg _string {string|Buffer} - Contents of the INI file (optional)
  */
  parse (_string) {

    this._tree = this._parser.parse(_string.toString()).items;
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
    Print the contents of the potentially-modified abstract syntax tree
    (AST) as an INI file using the `emit` function, which defaults to
    standard output. The `emit` method may be overridden to provide
    alternative output types/destinations.
  */
  serialize () {

    for (let i = 0, ln1 = this._tree.length; i < ln1; ++i) {

      let section = this._tree[i];
      let nodes = (section.nodes || []);

      if (!(section instanceof ini.Section) || (section.name == '')) {
        continue;
      }

      this._emit_section(section.name);

      for (let j = 0, ln2 = nodes.length; j < ln2; ++j) {

        let node = nodes[j];

        if (node instanceof ini.Comment) {
          this._emit_comment(node.text);
        } else if (node instanceof ini.Property) {
          this._emit_property(node.key, node.value);
        }
      }
    }
  }

  /**
    Transform the parsed INI file according to a set of rules.

    @arg _sections {Object} - A dictionary of section names to which the
      transformation should apply. Keys are case-sensitive section names;
      property/key values are ignored entirely. These are ORed together.
    @arg _where {Object} - A dictionary of properties which must match in
      order for the transformation to be applied. Both keys and values are
      case-sensitive. These are ANDed together; all clauses must match in
      order for a section to have a transformation applied.
    @arg _comment_where {Object} - A dictionary of comment text that must
      be present in order for the transformation to be applied. Keys are
      case-sensitive trimmed comment text; property/key values are ignored
      entirely. These are ANDed together; all properties must match in order
      for the transformation to be applied.
    @arg _fn {Function} - The transformation function to be applied. The
      function's prototype is `fn(i, section, indicies)`, where `i` is the
      section offset in `this.tree`, `section` is the name of the section
      being transformed, and `indicies` are the zero-based offsets of all
      properties that were matched by the `_where` clause.
  */
  transform_section (_sections, _where, _comment_where, _fn) {

    let where = (_where || {});
    let sections = (_sections || {});
    let comment_where = (_comment_where || {});

    let count_needed = (
      Object.keys(where).length + Object.keys(comment_where).length
    );

    let property_indices = {};

    for (let i = 0; i < this._tree.length; ++i) {

      let n = 0;
      let section = this._tree[i];
      let nodes = (section.nodes || []);

      if (Object.keys(sections).length > 0 && !sections[section.name]) {
        continue;
      }

      for (let j = 0, ln2 = nodes.length; j < ln2; ++j) {

        let node = nodes[j];

        if (node instanceof ini.Comment) {
          if (comment_where[node.text.trim()] != null) { n++; }
        } else if (node instanceof ini.Property) {
          let should_set = (
            where[node.key] instanceof RegExp ?
              !!(where[node[key]],match(node.value))
                : where[node.key] === node.value
          );
          if (should_set) {
            n++;
          }
        }
      }

      if (n == count_needed) {
        _fn(i, section, property_indices);
      }
    }
  }

  /**
    Remove an INI file section that matches the `_sections`, `_where`,
    and `_comment_where` criteria. For more information on what these
    mean and how they are structured, see the `transform_section` method.
  */
  delete_section (_sections, _where, _comment_where) {

    return this.transform_section(
      _sections, _where, _comment_where, (_i) => this.tree.splice(_i, 1)
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
  */
  edit_section (_sections, _where, _comment_where, _properties, _comments) {

    let comments = (_comments || {});
    let properties = (_properties || {});

    this.transform_section(
      _sections, _where, _comment_where, (_i, _section) => {

        let new_comments = [];
        let visited_properties = {};
        let nodes = (_section.nodes || []);

        /* Modify properties */
        for (let i = 0; i < nodes.length; ++i) {

          let node = nodes[i];

          if (node instanceof ini.Property) {
            if (properties[node.key] != null) {
              /* Replace property */
              visited_properties[node.key] = true;
              node.value = properties[node.key];
            } else if (properties[node.key] === null) {
              /* Delete property */
              nodes.splice(i, 1);
            }
          } else if (node instanceof ini.Comment) {
            if (comments[node.text.trim()] === null) {
              /* Delete comment */
              nodes.splice(i, 1);
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
            new_comments.push(new ini.Comment(this._comment_char, ` ${k}`));
          }
        }

        /* Prepend new comments */
        for (let i = new_comments.length; i > 0; --i) {
          _section.nodes.unshift(new_comments[i - 1]);
        }
      }
    );

    return this;
  }

  /**
    Add a new section to the parsed INI file.

    @arg _section {String} - The name of the section to add
    @arg _properties {Object} - A key/value dictionary of section properties
    @arg _comments {Array} - An array of section comment strings to prepend
    @arg _should_prepend {boolean} - True if the new section should be first
  */
  add_section (_section, _properties, _comments, _should_prepend) {

    let section = new ini.Section();
    section.name = _section;

    /* Append comments */
    for (let i = 0, len = _comments.length; i < len; ++i) {
      section.nodes.push(new ini.Comment(
        this._comment_char, ` ${_comments[i]}`
      ));
    }

    /* Append properties */
    for (let k in _properties) {
      let p = new ini.Property(k);
      p.delimiter = '='; p.value = _properties[k];
      section.nodes.push(p);
    }

    if (_should_prepend) {
      this.tree.unshift(section);
    } else {
      this.tree.push(section);
    }

    return this;
  }

  /**
    Emit a string to the output medium of your choice. The default
    implementation uses `console.log` and writes to standard output.
  */
  emit (_str) {

    console.log(_str || '');
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

    this.emit(`#${_str}`);
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

