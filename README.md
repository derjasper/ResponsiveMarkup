Responsive Markup
=================


This is a small library I wrote for a project I worked on. It is aimed to allow simple WYSIWYG editing of pages with responsive layouts. Applications are for example website builders or profile pages.
The output is an XML file which can be uploaded to a server which should validate the XML file using XSD.

For responsive layouts, media querys are not used as they depend on the window size. This library applies classes with suffixes dependent on the parent element's size to blocks.


Structure
---------

A page consists of *blocks*. Blocks have a *type* and have attributes, are displayed and edited according to the current *layout definition* and type. An editor may hook into the core to allow in-place editing of the page.

Three modes are supported: View, simple edit and extended edit.

* View: display
* simple edit: Only blocks specifying an area using the `area-id` and their children can be edited. This allows defining templates which cannot be messed up by the user.
* extended edit: no restrictions


Files
-----

* `index.html` is an example editor implementation
* `text.xml` is an example output file which is loaded in index.html
* `libs/responsivemarkup/responsivemarkup.js` is the core library responsible for rendering XML files to HTML code, adding classes dependent on window size and enabling the editor
* `libs/responsivemarkup/definition/default.*` files for the default definition: a js file for rendering html, (s)css files for stylesheets and a xsd file for server-side input validation


Demo
----

See it in action at http://derjasper.github.io/ResponsiveMarkup/


Questions?
----------

I released this library because I thought it may be useful to someone. It is no longer actively developed until I have a new use case in one of my projects (this library was used in an Angular 1 app and it worked quite well). Sadly, this code lacks documentation. If you have any questions, feel free to contact me (see my website http://jaspernalbach.de/).


License
-------

MIT
