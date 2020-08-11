
iniedit
=======

Introduction
------------

The `iniedit` utility is a small program for adding, updating, and deleting
sections and/or entries in Common INI Format files. It provides a Javascript
API and command-line interface, and allows for conditional criteria to be
specified as preconditions for any section modifiction, addition, or deletion
operation.

This repository is a work in progress and should not be used in production
at this time.

Quick Start
-----------

In addition to an ES7 Javascript API, this package provides a fully-functional
command-line executable called `iniedit`, which is suitable for small one-off
modification of INI files. To get started, run `npm i @castlelemongrab/iniedit`,
then `iniedit -h`, `iniedit add -h`, `iniedit delete -h`, or `iniedit modify -h`
to view built-in documentation.

### Example: Build an INI file from /dev/null

```shell
iniedit add -f /dev/null \
  -s Section -l A=1 -l B=2 -c Comment > my.ini

[Section]
# Comment
A = 1
B = 2
```

### Example: Conditionally add a new INI section

If a section named `Section` exists with property values `A = 1` and `B = 2`,
then add a new section named `Section #2` with properties `A = 2` and `B=3`.

```shell
iniedit add \
  -f my.ini -x Section -n A=1 -n B=2 -s 'Section #2' -l A=2 -l B=3 > my-2.ini

[Section]
# Comment
A = 1
B = 2
[Section #2]
A = 2
B = 3
```

### Example: Adding a property to multiple sections

Regular expressions can be used to match section names, property names, and
property values. This example adds or replaces an INI line (N.B. section
property) named `Type` in any INI file section that begins with `Section`.

```shell
iniedit modify -f my-2.ini -r \
  -x '^Section.*' -l Type=Awesome > my.ini

[Section]
# Comment
A = 1
B = 2
Type = Awesome
[Section #2]
A = 2
B = 3
Type = Awesome
```

### Example: Deleting a section with regular expressions

Regular expressions can be used to match section names, property names, and
property values. This example seletes an INI section thst has a certain
matching property value; the key is ignored.

```shell
iniedit delete -f my.ini \
  -r -n '.*=3' > my-2.ini

[Section]
# Comment
A = 1
B = 2
Type = Awesome
```

### Example: Editing properties

This example adds a new key/value pair and comment to any section that starts
with `Section` and has a `Type` of `Awesome`.

```shell
iniedit modify -f my-2.ini -r \
  -x '^Section.*$' -n 'Type=Awesome!?' -l ' Key = Value' -m Extra > my.ini

[Section]
# Extra
# Comment
A = 1
B = 2
Type = Awesome
Key = Value
```

CLI Documentation
-----------------

```
iniedit <command>

Commands:
  iniedit add     Add an entire section to an INI file
  iniedit delete  Delete an entire section of an INI file
  iniedit modify  Modify properties in an INI file section

Options:
  --version              Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
  -f, --file             The input file in common INI format [string] [required]
  -x, --require-section  Only modify this section name matches           [array]
  -n, --require-line     Only modify if this line exists                 [array]
  -m, --require-comment  Only modify if this comment exists              [array]
  -r, --regex            Interpret match criteria as expressions       [boolean]
```
```
iniedit add

Add an entire section to an INI file

Options:
  --version              Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
  -f, --file             The input file in common INI format [string] [required]
  -x, --require-section  Only modify this section name matches           [array]
  -n, --require-line     Only modify if this line exists                 [array]
  -m, --require-comment  Only modify if this comment exists              [array]
  -r, --regex            Interpret match criteria as expressions       [boolean]
  -s, --section          The name of the section to add      [string] [required]
  -l, --line             A line to add, or key name to read from stdin   [array]
  -c, --comment          A comment string to add                         [array]
  -t, --top              Add the new section to the top of the file    [boolean]
```
```
iniedit delete

Delete an entire section of an INI file

Options:
  --version              Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
  -f, --file             The input file in common INI format [string] [required]
  -x, --require-section  Only modify this section name matches           [array]
  -n, --require-line     Only modify if this line exists                 [array]
  -m, --require-comment  Only modify if this comment exists              [array]
  -r, --regex            Interpret match criteria as expressions       [boolean]
```
```
iniedit modify

Modify properties in an INI file section

Options:
  --version              Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
  -f, --file             The input file in common INI format [string] [required]
  -x, --require-section  Only modify this section name matches           [array]
  -n, --require-line     Only modify if this line exists                 [array]
  -m, --require-comment  Only modify if this comment exists              [array]
  -r, --regex            Interpret match criteria as expressions       [boolean]
  -l, --line             A line to add, or key name to read from stdin   [array]
  -c, --comment          A comment string to add                         [array]
  -d, --delete-line      A line name to delete                           [array]
  -o, --delete-comment   A comment string to delete                      [array]
  -e, --section          A replacement section name                     [string]
```

API Documentation
-----------------

<a name="constructor" />
<h3><pre>
ini
</pre></h3>

```typescript
ini = new Ini(_string: String, _options: Object)
```

<p>
Create a new instance of the INI file modification engine.
</p>
<dl>
  <dt><code>_string</code></dt>
    <dd>
      <i>Optional</i>: Contents of the INI file to pass to <code>parse</code>
    </dd>
  <dt><code>_options</code></dt>
    <dd>
      <i>Optional</i>: An associative array of generic opeions as an `Object`
    </dd>
</dl>

<a name="parse" />
<h3><pre>
ini.parse
</pre></h3>

```typescript
ini.parse(_string: String)
```

<p>
Parse an INI file from a <code>String</code> or <code>Buffer</code>.
</p>
<dl>
  <dt><code>_string</code></dt>
    <dd>
      <i>Optional</i>:
      Contents of the INI file to parse into an internal syntax tree
    </dd>
</dl>

<a name="serialize" />
<h3><pre>
ini.serialize()
</pre></h3>
<p>
Emit the internal abstract syntax tree, using this instance's <code>IOH</code>
object.  To capture or redirect output, provide an <code>IOH</code> instance
via the constructor's <code>_options.io</code> parameter.
</p>

<a name="transform_section" />
<h3><pre>
ini.transform_section
</pre></h3>

```typescript
ini.transform_section(
  _sections: Array<String|RegExp>,
    _where: Array<[k: String|RegExp, v: String|RegExp]>,
    _comment_where: Array<String|RegExp>,
    _fn: Function(_i: Number, _section: Object)
)
```

<p>
Call <code>_fn</code> and allow it to modify any section of the parsed INI
file's abstract syntax tree if it matches.
</p>
<dl>
  <dt><code>_sections</code></dt>
  <dd>
    <i>Optional</i>: An array of section names to which the
    transformation should apply. Values are case-sensitive section names
    and/or regular expressions. These are ORed together; any can match.
  </dd>
  <dt><code>_where</code></dt>
  <dd>
    <i>Optional</i>: An array of two-tuple (key/value pair) properties
    that must match in order for the the transformation to be applied.
    Both keys and values are case-sensitive, and may be strings or regular
    expressions. These matches are ANDed together; all clauses must match
    in order for a section to have a transformation applied.
  </dd>
  <dt><code>_comment_where</code></dt>
  <dd>
    <i>Optional</i>: An array of comment text to which the
    transformation should apply. Values are case-sensitive comment text
    and/or regular expressions. These are ANDed together; all must match.
  </dd>
  <dt><code>_fn</code></dt>
  <dd>
    <b>Required</b>: The transformation function to be applied. The
    function's prototype is `fn(i, section)`, where `i` is the section
    offset in `this.tree`, and `section` is the name of the section
    being transformed,
  </dd>
</dl>

<a name="delete_section" />
<h3><pre>
ini.delete_section
</pre></h3>

```typescript
ini.delete_section(
  _sections: Array<String|RegExp>,
    _where: Array<[k: String|RegExp, v: String|RegExp]>,
    _comment_where: Array<String|RegExp>,
    _fn: Function(_i: Number, _section: Object)
)
```

<p>
Remove an INI file section that matches the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria.
</p>
<dl>
  <dt><code>_sections, _where, _comment_where</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#transform_section"><code>transform_section</code></a>
    method.
    </dd>
</dl>


<a name="modify_section" />
<h3><pre>
ini.modify_section
</pre></h3>

```typescript
ini.modify_section(
  _sections: Array<String|RegExp>,
    _where: Array<[k: String|RegExp, v: String|RegExp]>,
    _comment_where: Array<String|RegExp>,
    _properties: Object, _comments: Object, _name: String
)
```

<p>
Modify an INI file section that matches the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria.
</p>
<dl>
  <dt><code>_sections, _where, _comment_where</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#transform_section"><code>transform_section</code></a>
    method.
  </dd>
  <dt><code>_properties</code></dt>
  <dd>
    <i>Optional</i>: An <code>Object</code>-based associative array of new
    properties to add. Keys are interpreted as new or replacement property
    names; values are interpreted as new or replacement property values. A
    value of <code>null</code> is interpreted as a request to repove the
    entire INI line whose property name matches the key.
  </dd>
  <dt><code>_comments</code></dt>
  <dd>
    <i>Optional</i>: An <code>Object</code>-based associative array of new
    comments to add. Keys are interpreted as new or replacement comments;
    values are interpreted as either null or non-null. If a value is non-null,
    the comment is added. If a value is strictly null, the comment is removed
    if it exists.
  </dd>
  <dt><code>_name</code></dt>
  <dd>
    <i>Optional</i>: A <code>String</code> to replace the section name with.
    If this option is null or undefined or omitted, the section's name will
    remain the same.
  </dd>
</dl>

<a name="add_section" />
<h3><pre>
ini.add_section
</pre></h3>

```typescript
ini.add_section(
  _name: String, _properties: Object, _comments: Object,
  _should_prepend: Boolean,
  _sections: Array<String|RegExp>,
    _where: Array<[k: String|RegExp, v: String|RegExp]>,
    _comment_where: Array<String|RegExp>,
)
```

<p>
Add a new section to an INI file provided that the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria match at
least one already-existing section in the abstract syntax tree.
</p>
<dl>
  <dt><code>_name</code></dt>
  <dd>
    <b>Required</b>: The name of the new section to be added.
  </dd>
  <dt><code>_properties, _comments</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#modify_section"><code>modify_section</code></a> method.
  </dd>
  <dt><code>_should_prepend</code></dt>
  <dd>
    <i>Optional</i>: True if the section should be added at the beginning of
    the abstract syntax tree (and therefore at the top of the resulting INI
    file). False or false-like if the section should be appended to the
    abstract syntax tree (and therefore at the bottom of the resulting file).
  </dd>
  <dt><code>_sections, _where, _comment_where</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#transform_section"><code>transform_section</code></a>
    method.
  </dd>
</dl>


Credits
-------

Copyright 2020, David Brown  
Copyright 2020, Baby Britain, Ltd.


License
-------

MIT
