# jQuery.tabulate

  Pulled from comments in source, need to refactor:


  Contains the sections of the table and their settings.  By default,
  the sections "head", "body" and "foot" have been defined for you.
  You may use these sections for your table, overwrite them, or
  define your own.

  Valid settings include:

  <ul>
    <li>
    <strong>container</strong><br /><br />
    The container for this section.  Can be a string containing
    HTML or a jQuery object.
    </li>
    <li>
    <strong>key</strong><br /><br />
    The key in your data set to bind to this section.  This should
    point to the data you want to build the section out with.  By
    default, the name of the section will be used as the key.
    </li>
    </li>
    <strong>rows</strong><br /><br />
    Properties to assign to the rows in this section.

    Valid row properties include any of the following:

    <ul>
      <li>
      <strong>content</strong><br /><br />
      May be used to set the content of the cells within the
      row.  The content property accepts any of the following:
      a jQuery object, HTML, a String, a Number or a Function
      returning one of the previously stated types.  If a 
      function is given, three arguments will be passed in:
      $row (the current row, wrapped in a jQuery object),
      $content (the content areas of the cells within the row,
      wrapped in a jQuery object), and data (any data associated
      with the current row).
      </li>
      <li>
      <strong>filter</strong><br /><br />
      May be used to set additional properties on the row
      (including attributes, styles, events, etc).  This
      property only accepts a function.  Three arguments 
      will be available at runtime: $row (the current row,
      wrapped in a jQuery object), $content (the content areas
      of the cells within the row, wrapped in a jQuery object),
      and data (any data associated with the current row).
      </li>
    </ul>
  </li>
  <li>
    <strong>cells</strong><br /><br />

    Properties to assign to the columns in this section.
    Valid cell properties include any of the following:

    <ul>
      <li>
      <strong>content</strong><br /><br />
      May be used to set the content of the cell.  The
      content property accepts any of the following: a
      jQuery object, HTML, a String, a Number or a Function
      returning one of the previously stated types.  If a 
      function is given, three arguments will be passed in:
      $cell (the current cell, wrapped in a jQuery object),
      $content (the content area of that cell, wrapped in a
      jQuery object), and data (any data associated with the
      current cell).
      </li>
      <li>
      <strong>filter</strong><br /><br />
      May be used to set additional properties on the cell
      (including attributes, styles, events, etc).  This
      property only accepts a function.  Three arguments 
      will be available at runtime: $cell (the current cell,
      wrapped in a jQuery object), $content (the content area
      of that cell, wrapped in a jQuery object), and data
      (any data associated with the current cell).
      </li>
    </ul>
    </li>
  </ul>

  <p>
    Note that even if a section is defined, it will only be shown
    if it has data associated with it.
  </p>

## Change Log
__Version 2.3__ (10/13/2010)

* Fix multiple instance bugs
* Clean up tabulate method
* Added "no_results" event handler
* Cleanup and reorganization of options
* Add more example content
* Updated jsdocs
* Updated this README

__Version 2.2__ (10/08/2010)

* Updated demo and examples
* Added new images to default theme
* Removed minified version (will re-institute in tagged versions)
* Added pagination for static JSON data (scope)
* Fixed bugs relating to table options and their data
* Added AJAX load example, including a PHP JSON feed file	

__Version 2.1__ (09/27/2010)

* Cleanup and reorganization.
* Refined dependencies

__Version 2.0__ (06/27/2010)

* Added demo page.
* Added "default" theme style and images.
* Added the ability to pass content and class names in as a function.
* Changed the way columns are built via passing them in.  You now pass
  in row and column information into the "table" object, which is then
  divided into the "rows" and "columns" objects.  Each of these are
  also broken down by section (usually "head", "body" and/or "foot").
  This grouping seems to make more sense, logically.
* Changed the way tabulate initially gathers its data.  It is now
  nested within the "data" object as "source" -- also changed the
  "load" function to "gather_data" as it makes more sense, logically.
* Semantic changes, mainly for readability and namespacing.

__Version 1.2__ (06/22/2010)

* Fixed passing in rows and columns as objects (previously resulted in
  an empty dataset as the object would be pushed to an array).
* Fixed rows and columns event handlers not being called because of
  namespacing (namespacing of event handlers is now user controlled).
* Fixed column names if columns is passed as an object, fixed column
  name if array is passed (now uses a "one" based index instead of "zero").
* Added convenience methods for triggering event handlers and error
  handlers ("trigger" and "error", respectfully), useful especially
  when called from outside the class.
* Added a "filters" parameter to the load function which allows you
  to apply filters to a single request only (does not store these filters
  in class).
  
__Version 1.0__ (06/11/2010)

* Initial release

## Contact
Found a bug?  Have a suggestion?  Please shoot me an email (see above).

## License
Copyright (c) 2011 Kyle Florence  
Dual licensed under the BSD and MIT licenses.
