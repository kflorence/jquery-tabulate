# jQuery.tabulate
__Author__ Kyle Florence <kyle.florence@gmail.com>  
__Version__ 2.1.20100627

## Change Log
* __09/27/2010__ Version 2.1
    * TODO

* __06/27/2010__ Version 2.0
    * FEATURES
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

    * MISC
        * Semantic changes, mainly for readability and namespacing.

* __06/22/2010__ Version 1.2
    * BUG FIXES
        * Fixed passing in rows and columns as objects (previously resulted in
        an empty dataset as the object would be pushed to an array).
        * Fixed rows and columns event handlers not being called because of
        namespacing (namespacing of event handlers is now user controlled).
        * Fixed column names if columns is passed as an object, fixed column
        name if array is passed (now uses a "one" based index instead of "zero").
    * FEATURES
        * Added convenience methods for triggering event handlers and error
        handlers ("trigger" and "error", respectfully), useful especially
        when called from outside the class.
        * Added a "filters" parameter to the load function which allows you
        to apply filters to a single request only (does not store these filters
        in class).
  
* __06/11/2010__ Version 1.0
    * Initial release

## Contact
Found a bug?  Have a suggestion?  Please shoot me an email (see above).

## License
Copyright (c) 2010 Kyle Florence  
Licensed under the GNU General Public License.  
[http://www.gnu.org/licenses/gpl.html](http://www.gnu.org/licenses/gpl.html)