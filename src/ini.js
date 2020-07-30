
let fs = require('fs');
let Base = require('./base');
let ini = require('@jedmao/ini-parser');

/**
**/
const Ini = class extends Base {

  /**
  */
  constructor (_options) {

    super(_options);

    this._tree = null;
    this._parser = new ini.default();
    this._parser.configure({ comment: /#/ });

    return this;
  }

  /**
  */
  parse (_string) {

    this._tree = this._parser.parse(_string.toString()).items;
    return this;
  }

  /**
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

      this._emit();
    }
  }

  /**
  */
  delete_section (_name, _where, _comment_where) {

    let where = (_where || {});
    let comment_where = (_comment_where || {});

    let count_needed = (
      Object.keys(where).length + Object.keys(comment_where).length
    );

    for (let i = 0; i < this._tree.length; ++i) {

      let n = 0;
      let section = this._tree[i];
      let nodes = (section.nodes || []);

      if (section.name != _name) {
        continue;
      }

      for (let j = 0, ln2 = nodes.length; j < ln2; ++j) {

        let node = nodes[j];

        if (node instanceof ini.Comment) {
          if (comment_where[node.text.trim()] != null) { n++; }
        } else if (node instanceof ini.Property) {
          if (where[node.key] === node.value) { n++; }
        }
      }

      if (n == count_needed) {
        this._tree.splice(i, 1);
      }
    }
  }

  /**
  */
  _emit (_str) {

    console.log(_str || '');
    return this;
  }

  /**
  */
  _emit_section (_str) {

    this._emit(`[${_str.replace(/(\[|\])/g, '\\$1')}]`);
    return this;
  }

  /**
  */
  _emit_comment (_str) {

    this._emit(`#${_str}`);
    return this;
  }

  /**
  */
  _emit_property (_key, _value) {

    let key = this._escape_equals(_key);
    this._emit(`${key} = ${_value}`);
  }

  /**
  */
  _escape_equals (_str) {

    return _str.replace('\\', '\\\\').replace('=', '\\=');
  }
};

/* Export symbols */
module.exports = Ini;

