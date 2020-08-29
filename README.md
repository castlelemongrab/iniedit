
iniedit
=======

Introduction
------------

The `iniedit` utility is a small program for adding, updating, and deleting
sections and/or entries in Common INI Format files. It provides a Javascript
API and command-line interface, and allows for conditional criteria to be
specified as preconditions for any section modification, addition, or deletion
operation.

This repository is a work in progress and absolutely should not be used in
production at this time.

CLI Quick Start
---------------

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
  -f my.ini -x Section -n A=1 -n B=2 -s 'Section #2' -l A=2 -l B=3

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
iniedit modify -f my.ini \
  -r -x '^Section.*' -l Type=Awesome

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
  -r -n '.*=3'

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
iniedit modify -f my.ini -r \
  -x '^Section.*$' -n 'Type=Awesome!?' -l ' Key = Value' -m Extra

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

The command-line interface makes references to INI file "lines"; these are
section-contained INI properties specified as `key = value` pair arguments.
Backslash (`\`) is the escape character for the `key` portion; values are
currently passed along as-is. This CLI escaping behavior – along with escaping
and quoting behavior in serialized INI files themselves – will be made more
configurable in a future version.

```
iniedit <command>

Commands:
  iniedit read    Read from one or more matched sections
  iniedit add     Add an entire section to an INI file
  iniedit delete  Delete an entire section of an INI file
  iniedit modify  Modify properties in an INI file section

Global Options:
  --version              Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
  -v, --verbose          Print extra information to standard error     [boolean]
  -f, --file             The input file in common INI format [string] [required]
  -x, --require-section  Only modify this section name matches           [array]
  -n, --require-line     Only modify if this line exists                 [array]
  -m, --require-comment  Only modify if this comment exists              [array]
  -r, --regex            Interpret all match criteria as expressions   [boolean]
```
```
iniedit read

Read from one or more matched sections

Local Options:
  -l, --line             The property/line values to read                [array]
  -c, --comments         Also print all comments, in order             [boolean]

```
```
iniedit add

Add an entire section to an INI file

Local Options:
  -s, --section          The name of the section to add      [string] [required]
  -l, --line             A line to add, or key name to read from stdin   [array]
  -c, --comment          A comment string to add                         [array]
  -t, --top              Add the new section to the top of the file    [boolean]
```
```
iniedit delete

Delete an entire section of an INI file

Local Options:
  -c, --compactify       Compact whitespace on both sides of deletion  [boolean]
```
```
iniedit modify

Modify properties in an INI file section

Local Options:
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
Ini.Default
</pre></h3>

```typescript
let ini = new Ini.Default(_string: String, _options: Object)
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

<a name="query" />
<h3><pre>
Ini.Query
</pre></h3>

```typescript
let q = new Ini.Query(
  _sections: Array<String|RegExp>?,
  _where: Array<[ String|RegExp, String|RegExp ]>?,
  _comments: Array<String|RegExp>?
);
```
<p>
Create a search query predicate for use with the `Ini.Default` methods
<a href="#add_section"><code>add_section</code></a>,
<a href="#delete_section"><code>delete_section</code></a>,
<a href="#modify_section"><code>modify_section</code></a>, or
<a href="#read_properties"><code>read_properties</code></a>,
</p>
<dl>
  <dt><code>_sections</code></dt>
  <dd>
    <i>Optional</i>: An array of section names that should be matched
    against the section names in the INI file.. Values are case-sensitive
    strings and/or regular expressions. This is an OR operation; of any
    one of the specified criteria matches, the section matches.
  </dd>
  <dt><code>_where</code></dt>
  <dd>
    <i>Optional</i>: An array of two-tuple (key/value pair) properties
    that must match in order for the the transformation to be applied.
    Both keys and values are case-sensitive, and may be strings or regular
    expressions. THis criteria is combined via AND: all clauses must match
    in order for a section to match.
  </dd>
  <dt><code>_comment_where</code></dt>
  <dd>
    <i>Optional</i>: An array of comment text that must exist for a match
    to occur. Values are case-sensitive text and/or regular expressions.
    These are ANDed together; all must exist independentely and match.
  </dd>
</dl>
<p>
Create a new query for the INI file transformation system. 
</p>
<dl>
</dl>

<a name="parse" />
<h3><pre>
ini.parse
</pre></h3>

```typescript
ini.parse(_string: String)
```
<p>
Create an internal abstract syntax tree from the INI file contents specified
in `_string`.
</p>

<a name="serialize" />
<h3><pre>
ini.serialize
</pre></h3>
<p>
Emit the internal abstract syntax tree, using this instance's <code>IOH</code>
object.  To capture or redirect output, provide an <code>IOH</code> instance
via the constructor's <code>_options.io</code> parameter.
</p>


<a name="transformer" />
<h3><pre>
Ini.Transformer
</pre></h3>

```typescript
let transform = new transformer(ini.tree);
transform.run(
  _query: Ini.Query, _fn: Function(_i: Number, _section: Object)
)
```
<p>
Call <code>_fn</code> and allow it to modify any section of the parsed INI
file's abstract syntax tree if the predicates provided match. A set of
entirely empty predicates will match any and all sections.
</p>
<dl>
  <dt><code>_query</code></dt>
  <dd>
    <i>Optional</i>: An instance of Ini.Query specifying matching criteria
    for the modifications requested. If a section does not match, it will
    not be modified.
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
  _query: Ini.Query
)

```

<p>
Remove an INI file section that matches the query <code>_query</code>,
</p>
<dl>
  <dt><code>_query</code></dt>
  <dd>
    <i>Optional</i>: An instance of Ini.Query specifying matching criteria
    for the modifications requested. If a section does not match, it will
    not be altered in any way.
  </dd>
  <dt><code>_query</code></dt>
</dl>


<a name="modify_section" />
<h3><pre>
ini.modify_section
</pre></h3>

```typescript
ini.modify_section(
  _query: Ini.Query,
    _properties: Object?, _comments: Object?, _name: String?
)
```

<p>
Modify an INI file section that matches the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria.
</p>
<dl>
  <dt><code>_query</code></dt>
  <dd>
    <i>Optional</i>: An instance of Ini.Query specifying matching criteria
    for the modifications requested. If a section does not match, it will
    not be altered in any way.
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
  _name: String, _properties: Object?,
  _comments: Object?, _should_prepend: Boolean?, _query: Ini.Query?
)
```
<p>
Add a new section to an INI file, provided that the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria match at least
one section in the abstract syntax tree. If all three criteria are omitted or
empty, this function considers it a match, and adds the requested section.
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
  <dt><code>_query</code></dt>
  <dd>
    <i>Optional</i>: An instance of Ini.Query specifying matching criteria
    for the modifications requested. If a section does not match, it will
    not be altered in any way.
  </dd>
</dl>

<a name="read_properties" />
<h3><pre>
ini.read_properties
</pre></h3>

```typescript
ini.read_properties(
  _query: Ini.Query?, _names: Object, _comments: Boolean?
)
```
<p>
For all sections matching the <code>_sections</code>, <code>_where</code>,
and <code>_comment_where</code> criteria, write the INI property values
print the value of any property name that appears in <code>_names</code>.
Emit results to the current IO object (or standard ourpur) in file order.
</p>
<dl>
  <dt><code>_query</code></dt>
  <dd>
    <i>Optional</i>: An instance of Ini.Query specifying matching criteria
    for the modifications requested. If a section does not match, it will
    not be altered in any way.
  </dd>
  <dt><code>_names</code></dt>
    An object containing property names as keys; values for these keys will
    be printed to the current IO object (or standard output) in file order.
  <dd>
  </dd>
  <dt><code>__comments</code></dt>
  <dd>
    <i>Optional</i>: True if all comments in matching sections should be
    included in the output in file order. Comments will appear in file order.
  </dd>
</dl>

Credits
-------

Copyright 2020, David Brown  
Copyright 2020, Baby Britain, Ltd.


License
-------

MIT
