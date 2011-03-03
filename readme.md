# jQuery.tabulate

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