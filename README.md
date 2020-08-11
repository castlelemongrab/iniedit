
iniedit
=======

The `iniedit` utility is a small program for adding, updating, and deleting
sections and/or entries in Common INI Format files. It provides a Javascript
API and command-line interface, and allows for conditional criteria to be
specified as preconditions for any section addition, deletion, or modification
operation.

This repository is a work in progress and should not be used in production
at this time.


API Documentation
-----------------

<a name="constructor" />
<h3><pre>
let ini = new Ini(_string: String, _options: Object)
</pre></h3>
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
ini.parse(_string: String)
</pre></h3>
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
<h3>
<pre>
ini.transform_section(
  _sections: Array&lt;String|RegExp&gt;,
    _where: Array&lt;[k: String|RegExp, v: String|RegExp]&gt;,
    _comment_where: Array&lt;String|RegExp&gt;,
    _fn: Function(_i: Number, _section: Object)
)
</pre>
</h3>
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
<h3>
<pre>
ini.delete_section(
  _sections: Array&lt;String|RegExp&gt;,
    _where: Array&lt;[k: String|RegExp, v: String|RegExp]&gt;,
    _comment_where: Array&lt;String|RegExp&gt;,
    _fn: Function(_i: Number, _section: Object)
)
</pre>
</h3>
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
<h3>
<pre>
ini.modify_section(
  _sections: Array&lt;String|RegExp&gt;,
    _where: Array&lt;[k: String|RegExp, v: String|RegExp]&gt;,
    _comment_where: Array&lt;String|RegExp&gt;,
    _properties: Object, _comments: Object, _name: String
)
</pre>
</h3>
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
<h3>
<pre>
ini.add_section(
  _name: String, _properties: Object, _comments: Object,
  _should_prepend: Boolean,
  _sections: Array&lt;String|RegExp&gt;,
    _where: Array&lt;[k: String|RegExp, v: String|RegExp]&gt;,
    _comment_where: Array&lt;String|RegExp&gt;,
)
</pre>
</h3>
<p>
Add a new section to an INI file provided that the <code>_sections</code>,
<code>_where</code>, and <code>_comment_where</code> criteria match at
least one already-existing section in the abstract syntax tree.
</p>
<dl>
  <dt><code>_properties, _comments</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#modify_section"><code>modify_section</code></a> method.
  </dd>
  <dt><code>_should_prepend</code></dt>
  <dd>
    True if the section should be added at the beginning of the abstract
    syntax tree (and therefore at the top of the resulting INI file). False
    if the section should be appended to the abstract syntax tree (and
    therefore at the bottom of the resulting INI file).
  </dd>
  <dt><code>_sections, _where, _comment_where</code></dt>
  <dd>
    For information on what these arguments mean and how they are structured,
    see the <a href="#transform_section"><code>transform_section</code></a>
    method.
  </dd>
</dl>


CLI Documentation
-----------------

This section will be completed shortly. In the mean time, help and examples
are available in the `test/integration` directory, or via `bin/iniedit -h`.



Credits
-------

Copyright 2020, David Brown  
Copyright 2020, Baby Britain, Ltd.


License
-------

MIT
