
let Base = require('./base');
let ini = require('@jedmao/ini-parser');

/**
**/
const Ini = class extends Base {

  /**
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
  */
  parse (_string) {

    this._tree = this._parser.parse(_string.toString()).items;
    return this;
  }

  /**
  */
  get tree () {

    return this._tree;
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
  */
  delete_section (_sections, _where, _comment_where) {

    return this.transform_section(
      _sections, _where, _comment_where, (_i) => this.tree.splice(_i, 1)
    );
  }

  /**
  */
  edit_section (_sections, _where, _comment_where, _properties, _comments) {

    let comments = (_comments || {});
    let properties = (_properties || {});

    this.transform_section(
      _sections, _where, _comment_where, (_i, _section) => {

        let visited = {};
        let new_comments = [];
        let nodes = (_section.nodes || []);

        /* Modify properties */
        for (let i = 0; i < nodes.length; ++i) {

          let node = nodes[i];

          if (node instanceof ini.Property) {
            if (properties[node.key] != null) {
              /* Replace */
              visited[node.key] = true;
              node.value = properties[node.key];
            } else if (properties[node.key] === null) {
              /* Delete */
              nodes.splice(i, 1);
            }
          }
        }

        /* Append new properties */
        for (let k in properties) {
          if (visited[k] == null && properties[k] !== null) {
            /* Add */
            let p = new ini.Property(k);
            p.delimiter = '='; p.value = properties[k];
            nodes.push(p);
          }
        }

        /* Build comments */
        for (let i = 0, len = comments.length; i < len; ++i) {
          new_comments.push(
            new ini.Comment(this._comment_char, ` ${comments[i]}`)
          );
        }

        /* Prepend comments */
        for (let i = comments.length; i > 0; --i) {
          _section.nodes.unshift(new_comments[i - 1]);
        }
      }
    );

    return this;
  }

  /**
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

