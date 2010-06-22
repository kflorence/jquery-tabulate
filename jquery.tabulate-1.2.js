/*
 * jQuery.tabulate Plugin
 * Copyright (C) 2010  Kyle Florence <kyle.florence@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @fileOverview The jQuery.tabulate plugin.
 * @author <a href="mailto:kyle.florence@gmail.com">Kyle Florence</a>
 * @version 1.2.20100622
 */

/**
 * The jQuery object.
 * 
 * @see <a href="http://jquery.com/">jquery.com</a>.
 * @type Object
 * @name jQuery
 * @class The jQuery library
 */

/**
 * The namespace for functions defined within the jQuery library.
 * 
 * @see jQuery
 * @name jQuery.fn
 * @type Object
 * @namespace Holds functions for the jQuery library.
 * @memberOf jQuery
 */

/**
 * Anonymous function wrapper.
 * 
 * <p>
 *   Creates closure for the jQuery.tabulate plugin.
 * </p>
 * 
 * @exports $ as jQuery
 * @param $ The jQuery object
 */
(function($) {
    /**
     * The jQuery.tabulate plugin.
     * 
     * <p>
     *   Tabulate is a jQuery plugin that takes arbitrary data, divides it into
     *   rows and columns, then builds a table around it.  It is meant to be
     *   very flexible and extensible and is purposely vague in some areas to
     *   accommodate these goals.
     * </p>
     * 
     * @example $('#element').tabulate({...});
     * @param {object} options An object containing default option overrides.
     * @return {jQuery} The jQuery object that was passed to this function.
     */
    $.fn.tabulate = function(options) {
        return this.each(function() {
            var $this = $(this);
            
            // don't re-create if this element has already been tabulated
            if (!$this.data("tabulate")) {
                /**
                 * The tabulate class instance.
                 * 
                 * @see jQuery.tabulate
                 * @name tabulate
                 * @type Object
                 * @class
                 */
                var tabulate = $.extend(true, {}, $.tabulate);

                // store class instance in $this
                $this.data("tabulate", tabulate);
                
                // initialize, pass in options
                tabulate.init($this, options);
                
                /**
                 * Object toString override
                 * 
                 * @return {String} "[object instance.name]"
                 */
                tabulate.toString = function() {
                    return "[object " + this.name + "]";
                };
            }
        });
    };

    /**
     * The tabulate class.
     * 
     * @type Object
     * @class Contains all of the members and methods needed by tabulate.
     */
    $.tabulate = {
        /**
         * The total number of rows in the dataset.
         * 
         * <p>
         *   This value is usually based on the value of
         *   {@link jQuery.tabulate.options.keys.rows}, but in it's absence may also
         *   be calculated by the number of rows found in the dataset.  It is
         *   set in {@link jQuery.tabulate.tabulate}.
         * </p>
         * 
         * @default 0
         * @type integer
         */
        count: 0,
        
        /**
         * The total number of "pages" in the dataset that are available for
         * viewing.
         * 
         * <p>
         *   This value is calculated in {@link jQuery.tabulate.tabulate} based upon
         *   the values of {@link jQuery.tabulate.count} and {@link jQuery.tabulate.filters.limit}.
         * </p>
         * 
         * @default 1
         * @type integer
         */
        total_pages: 1,
        
        /**
         * The "page" of the dataset that is currently being viewed.
         * 
         * <p>
         *   Used by the internal pagination system to limit the current view of
         *   the dataset.  This variable is modified by the navigation functions.
         * </p>
         * 
         * @see jQuery.tabulate.previous
         * @see jQuery.tabulate.next
         * @see jQuery.tabulate.go_to
         * @default 1
         * @type integer
         */
        current_page: 1,
        
        /**
         * The settings {@link jQuery.tabulate} will use by default.
         * 
         * <p>
         *   Note that any and all of these values can be overwritten as needed
         *   by passing them into the tabulate plugin upon initialization.
         * </p>
         * 
         * @type Object
         * @namespace Holds the default options for {@link jQuery.tabulate}
         */
        options: {
            /**
             * The name for this class instance.
             * 
             * <p>
             *   Generally used to define what is being tabulated, especially if
             *   another plugin is built on top of this one.  This is also used
             *   for namespacing events and for class names and ID's within the
             *   table.
             * </p>
             * 
             * @default "tabulate"
             * @type String
             */
            name: "tabulate",
            
            /**
             * Whether or not to allow AJAX request caching in the browser.
             * 
             * @see <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a>
             * @default false
             * @type boolean
             */
            cache_requests: false,
            
            /**
             * An Array of integer values that will be used to populate the
             * {@link jQuery.tabulate.options.elements.$results_per_page} element.
             * 
             * @default [5, 10, 25]
             * @type Array
             */
            results_per_page: [5, 10, 25],
            
            /**
             * A function that returns a RegExp object that will be used to
             * parse keys out of strings.
             * 
             * <p>
             *   By default, parse_key matches anything between matching
             *   brackets.  A global flag is also included so that multiple keys
             *   may be matched and replaced within one string.
             * </p>
             * 
             * <p>
             *   If you're wondering why we are returning the RegExp object
             *   inside of a function, see this jQuery bug ticket:
             *   <a href="http://dev.jquery.com/ticket/4192">#4192</a>. Although
             *   this issue has been fixed in jQuery 1.4, I am keeping this in
             *   here for backwards compatibility.
             * </p>
             * 
             * @return {RegExp} The RegExp object
             */
            parse_key: function() {
                return new RegExp(/\{([^{}]+)\}/g);
            },
            
            /**
             * A reference to the data tabulate will use to build the table.
             * 
             * <p>
             *   This data may be passed in explicitly or it may be loaded on 
             *   the fly with AJAX.  JSON is currently the only supported data
             *   type, though other data types may be added in the future.
             * </p>
             * 
             * @type Object
             * @namespace Holds JSON data or AJAX request settings.
             */
            data: {
                /**
                 * The settings for an AJAX request.
                 * 
                 * <p>
                 *   These settings that will be passed into <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a>.
                 *   Any of the options available to that function may be used
                 *   here, with the exception of the "success" and "error"
                 *   functions, which are overridden internally.
                 * </p>
                 * 
                 * <code>
                 * {
                 *     ajax: {
                 *         url: "/path/to/controller",
                 *         data: { method: "some_method" },
                 *         dataType: "json"
                 *     }
                 * }
                 * </code>
                 * 
                 * @see <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a>
                 * @default {}
                 * @type Object
                 */
                ajax: {},
                
                /**
                 * JSON data.
                 * 
                 * <code>
                 * {
                 *     json: {
                 *         count: 1234,
                 *         some_other_data: "data",
                 *         more_custom_data: "not needed by tabulate",
                 *         rows: {
                 *             "row1": {...},
                 *             "row2": {...},
                 *             ...
                 *             "row1234": {...}
                 *         }
                 *     }
                 * }
                 * </code>
                 * 
                 * @see <a href="http://jsonlint.com/">JSONLint</a>
                 * @default {}
                 * @type Object
                 */
                json: {}
            },
            
            /**
             * Contains the names of keys within the dataset that gives tabulate
             * the data it needs to build the table.
             * 
             * @type Object
             * @namespace Holds the names of keys in the dataset.
             */
            keys: {                
                /**
                 * The key that will store row data.
                 * 
                 * <p>
                 *   This data will be used to populate the columns within the
                 *   body of the table.  This key is pretty much required unless
                 *   you don't have any information to tabulate, in which case
                 *   this plugin is rather pointless for you!
                 * </p>
                 * 
                 * @default "rows"
                 * @type String
                 */
                rows: "rows",
                
                /**
                 * The key that will store column headers.
                 * 
                 * <p>
                 *   This data will be used to populate the table content of
                 *   the columns in the table header. This is useful if you need
                 *   to pass dynamic data into the table header.  If you don't
                 *   need dynamic headings, it's probably easier to set the
                 *   table headings manually in {@link jQuery.tabulate.options.columns}.
                 * </p>
                 * 
                 * @default "columns"
                 * @type String
                 */
                columns: "columns",
                
                /**
                 * The key that will store the total record count.
                 * 
                 * <p>
                 *   If this key is omitted, the number of rows in the dataset
                 *   will be used instead (note: this may break pagination).
                 * </p>
                 * 
                 * @default "count"
                 * @type String
                 */
                count: "count"
            },
            
            /**
             * An Array or Object containing rows and their properties.
             * 
             * <p>
             *   Rows are broken into two sections, head and body.  The
             *   properties inside these sections are applied to their
             *   respective locations in the table.  See
             *   {@link jQuery.tabulate.set_properties} for in depth documentation
             *   on what properties can be assigned to a row.
             * </p>
             * 
             * @default []
             * @type Array or Object
             */
            rows: {},
            
            /**
             * An Array or Object containing columns and their properties.
             * 
             * <p>
             *   Columns are broken into two sections, head and body.  The
             *   properties inside these sections are applied to their respective
             *   locations in the table.  See {@link jQuery.tabulate.set_properties}
             *   for in depth documentation on what properties can be assigned
             *   to a column.
             * </p>
             * 
             * <code>
             * {
             *     head: {
             *         content: "Column 1"
             *         styles: { "font-weight": "bold" }
             *     }
             *     body: {
             *         content: "This is column 1"
             *     }
             * }
             * </code>
             *
             * @see <a href="http://api.jquery.com/jQuery.css/">jQuery.css</a>
             * @default []
             * @type Array or Object
             */
            columns: {},
            
            /**
             * Filters to apply to the dataset.
             * 
             * <p>
             *   By default, limit and offset are the only filters.  Further
             *   filters may be added via {@link jQuery.tabulate.update_filters}.
             * </p>
             * 
             * @type Object
             * @namespace Holds filters for the dataset.
             */
            filters: {
                /**
                 * How many items to show per page.
                 * 
                 * @default 0
                 * @type integer
                 */
                limit: 0,
                
                /**
                 * Which item to start the dataset with.
                 * 
                 * @default 0
                 * @type integer
                 */
                offset: 0
            },
            
            /**
             * Can be used to override the default event handlers that are
             * defined in {@link jQuery.tabulate.event_handlers}.
             * 
             * @see jQuery.tabulate.event_handlers
             * @default {}
             * @type Object
             */
            event_handlers: {},
            
            /**
             * Can be used to override the default error handlers that are
             * defined in {@link jQuery.tabulate.error_handlers}.
             * 
             * @see jQuery.tabulate.error_handlers
             * @default {}
             * @type Object
             */
            error_handlers: {},
            
            /**
             * Contains the jQuery selectors for key elements.
             * 
             * <p>
             *   Keep in mind that upon initialization these values will be
             *   replaced by the jQuery object(s) they select.
             * </p>
             * 
             * @see jQuery.tabulate.init
             * @type Object
             * @namespace Holds all of our jQuery objects
             */
            elements: {
                /**
                 * The jQuery selector for the "loading" element.  This element is
                 * activated whenever tabulate is loading.
                 * 
                 * @default ".tabulate-loading"
                 * @type String
                 */
                $loading: ".tabulate-loading",
                
                /**
                 * The jQuery selector for the "previous" element.  This element
                 * is bound to the {@link jQuery.tabulate.previous} function.
                 * 
                 * @default ".tabulate-prev"
                 * @type String
                 */
                $previous: ".tabulate-prev",
                
                /**
                 * The jQuery selector for the "next" element.  This element is 
                 * bound to the {@link jQuery.tabulate.next} function.
                 * 
                 * @default ".tabulate-next"
                 * @type String
                 */
                $next: ".tabulate-next",
                
                /**
                 * The jQuery selector for the "count" element.  This element
                 * stores the value of the {@link jQuery.tabulate.count} variable.
                 * 
                 * @default ".tabulate-count"
                 * @type String
                 */
                $count: ".tabulate-count",
                
                /**
                 * The jQuery selector for the "total pages" element.  This
                 * element stores the value of the {@link jQuery.tabulate.total_pages}
                 * variable.
                 * 
                 * @default ".tabulate-total-pages"
                 * @type String
                 */
                $total_pages: ".tabulate-total-pages",
                
                /**
                 * The jQuery selector for the "current page" element.  This
                 * element stores the value of the {@link jQuery.tabulate.current_page}
                 * variable.
                 * 
                 * @default ".tabulate-current-page"
                 * @type String
                 */
                $current_page: ".tabulate-current-page",
                
                /**
                 * The jQuery selector for the "results per page" element.  This
                 * element is bound to the {@link jQuery.tabulate.update_filters}
                 * function, specifically for updating the "limit" filter.
                 * 
                 * @default ".tabulate-results-per-page"
                 * @type String
                 */
                $results_per_page: ".tabulate-results-per-page"
            },
            
            /**
             * The paths to various files required by the plugin.
             * 
             * <p>
             *   Note that some paths are generated inside of {@link jQuery.tabulate.init}.
             * </p>
             * 
             * @see jQuery.tabulate.init
             * @default {}
             * @type Object
             * @namespace Holds the default paths for {@link jQuery.tabulate}
             */
            paths: {
                /**
                 * The default path to this file.
                 * 
                 * <p>
                 *   By default, it is set to the path of the page being viewed.
                 *   This is probably not desired and should be overwritten.
                 * </p>
                 * 
                 * @default window.location.pathname
                 * @type String
                 */
                tabulate: window.location.pathname,
                
                /**
                 * The default path to the theme.
                 * 
                 * <p>
                 *   Please note that this path is relative to
                 *   {@link jQuery.tabulate.options.paths.tabulate}.
                 * </p>
                 * 
                 * @default "themes/default"
                 * @type String
                 */
                theme: "themes/default"
            }
        },
        
        /**
         * Contains jQuery objects generated from HTML fragments.
         * 
         * <p>
         *   These fragments are used to generate the table.  Feel free to edit
         *   the fragments to suit your needs.
         * </p>
         * 
         * @type Object
         * @namespace Holds all of our jQuery object fragments
         */
        fragments: {
            /**
             * Default anchor element.
             * 
             * @type jQuery
             */
            $link: $('<a />'),
            
            /**
             * Default image element.
             * 
             * @type jQuery
             */
            $image: $('<img />'),
            
            /**
             * Default option element.
             * 
             * @type jQuery
             */
            $option: $('<option />'),
            
            /**
             * Default row element.
             * 
             * @type jQuery
             */
            $row: $('<tr class="tabulate-row"></tr>'),
            
            /**
             * Default cell element.
             * 
             * @type jQuery
             */
            $cell: $('<td class="tabulate-cell"></td>'),
            
            /**
             * Default cell content element.
             * 
             * @type jQuery
             */
            $content: $('<div class="tabulate-cell-content"></div>'),
            
            /**
             * Default table element.
             * 
             * @type jQuery
             */
            $table: $('<table class="tabulate-table"></table>'),
            
            /**
             * Default table head element.
             * 
             * @type jQuery
             */
            $head: $('<thead class="tabulate-header"></thead>'),
            
            /**
             * Default table body element.
             * 
             * @type jQuery
             */
            $body: $('<tbody class="tabulate-body"></tbody>'),
            
            /**
             * Default table foot element.
             * 
             * @type jQuery
             */
            $foot: $(
                [
                    '<tfoot class="tabulate-footer">',
                    '    <tr class="tabulate-row">',
                    '        <td class="tabulate-cell clearfix">',
                    '            <div class="tabulate-cell-content">',
                    '                <div class="tabulate-partition tabulate-partition-first tabulate-pagination">',
                    '                    <img class="tabulate-prev" />',
                    '                    page <input class="tabulate-current-page" type="text" />',
                    '                    of <span class="tabulate-total-pages"></span>',
                    '                    <img class="tabulate-next" />',
                    '                </div>',
                    '                <div class="tabulate-partition tabulate-partition-no-input">',
                    '                    <span class="tabulate-count">0</span> total results',
                    '                </div>',
                    '                <div class="tabulate-partition tabulate-partition-no-input">',
                    '                    <div class="tabulate-loading"><span>Loading...</span></div>',
                    '                </div>',
                    '                <div class="tabulate-partition tabulate-partition-last">',
                    '                    <select class="tabulate-results-per-page"></select> results per page',
                    '                </div>',
                    '            </div>',
                    '        </td>',
                    '    </tr>',
                    '</tfoot>'
                ].join("")
            )
        },
        
        /**
         * Initializes the tabulate class.
         * 
         * <p>
         *   Merges default options with those passed in, builds the table
         *   skeleton, creates jQuery objects from {@link jQuery.tabulate.options.elements}
         *   and binds any needed event handlers.  Finally, triggers
         *   {@link jQuery.tabulate.event_handlers.event:post_init}.
         * </p>
         *
         * @param {jQuery} $wrapper The element(s) passed in from {@link jQuery.fn.tabulate}.
         * @param {object} options Options to overwrite the default ones with.
         */
        init: function($wrapper, options) {            
            var self = this;
            
            $.extend(true, this.options, options || {});
            $.extend(true, this, this.options);
            
            this.$wrapper = $wrapper;
            this.paths.theme = [this.paths.tabulate, this.paths.theme].join("/");

            // set limit to first item in results per page array, if not set
            this.filters.limit = this.filters.limit || this.results_per_page[0];

            // build our table
            this.$table = this.fragments.$table
                .append(this.$head = this.fragments.$head)
                .append(this.$body = this.fragments.$body)
                .append(this.$foot = this.fragments.$foot);

            // append table and store class instance in data
            this.$wrapper.append(this.$table).data("tabulate", this);
            
            // build jQuery objects from selectors
            $.each(this.elements, function(key, selector) {
                self.elements[key] = $(selector);
            });
            
            // bind previous button
            this.elements.$previous.attr({
                src: this.paths.theme + "/prev.gif",
                alt: "Previous Page",
                title: "Previous Page"
            }).click(function() {
                self.previous(this); return false;
            });
            
            // bind next button
            this.elements.$next.attr({
                src: this.paths.theme + "/next.gif",
                alt: "Next Page",
                title: "Next Page"
            }).click(function() {
                self.next(this); return false;
            });
    
            // bind current page handler to enter button
            this.elements.$current_page.keyup(function(event) {
                var page = parseInt($(this).val());

                if (!isNaN(page) && event.which == 13) {
                    self.go_to(this, page);
                }
            });
    
            // bind results per page handler
            this.elements.$results_per_page.change(function() {
                var limit = parseInt($(this).val());

                if (!isNaN(limit)) {
                    self.update_filters({limit: limit});
                }
            });

            // bind custom event handlers
            $.each(this.event_handlers, function(name, handler) {
                self.$wrapper.bind([name, self.name].join("."), function() {
                    handler.apply(self, arguments);
                });
            });

            // fire init handler
            this.trigger("post_init");
        },
        
        /**
         * Updates {@link jQuery.tabulate.current_page} to point to the previous
         * page.
         * 
         * <p>
         *   This function first checks to make sure we have a previous page to
         *   go to, then decrements current_page. Finally, it triggers
         *   {@link jQuery.tabulate.event_handlers.event:refresh}.
         * </p>
         * 
         * @param element The DOM element that was clicked.
         */
        previous: function(element) {
            if (this.current_page > 1) {
                this.current_page--;
                
                this.update_filters({
                    offset: ((this.current_page - 1) * this.filters.limit)
                });
            }
        },
        
        /**
         * Updates {@link jQuery.tabulate.current_page} to point to the next page.
         * 
         * <p>
         *   This function first checks to make sure we have a next page to go
         *   to, then increments current_page. Finally, it triggers
         *   {@link jQuery.tabulate.event_handlers.event:refresh}.
         * </p>
         * 
         * @param {element} element The DOM element that was clicked.
         */
        next: function(element) {
            if (this.current_page < this.total_pages) {
                this.current_page++;
                
                this.update_filters({
                    offset: ((this.current_page - 1) * this.filters.limit)
                });
            }
        },
        
        /**
         * Updates {@link jQuery.tabulate.current_page} to point to the specified
         * page.
         * 
         * <p>
         *   This function first checks to make sure the specified page exists,
         *   then sets current_page to its value. Finally, it triggers
         *   {@link jQuery.tabulate.event_handlers.event:refresh}.
         * </p>
         * 
         * @param {element} element The DOM element that was clicked.
         * @param {integer} page An integer value specifying the page to go to.
         */
        go_to: function(element, page) {
            if (page >= 1 && page <= this.total_pages) {                
                this.current_page = page;
                
                this.update_filters({
                    offset: ((this.current_page - 1) * this.filters.limit)
                });
            }
        },
        
        /**
         * Updates the filters that will be applied to the current dataset.
         * 
         * <p>
         *   This function will merge any filters that are passed in with those
         *   already present, overwriting any values that are already contained
         *   in the filters Object.  Any type of filter may be passed in here,
         *   including custom filters that you wish to pass to your controller.
         * </p>
         * 
         * <p>
         *   When the merge is complete, the current_page will be reset to 1 and
         *   the {@link jQuery.tabulate.event_handlers.event:refresh} event handler is
         *   called which reloads the data with the new filters applied.
         * </p>
         * 
         * @param {object} filters The filters to apply to the dataset.
         * @param {object} refresh Whether or not to call the refresh handler. Defaults to true.
         */
        update_filters: function(filters, refresh) {
            $.extend(true, this.filters, filters || {});

            if (refresh !== false) {
                this.trigger("refresh");
            }
        },
        
        /**
         * Convenience function for handling errors.
         * 
         * @param {String} name The name of the error handler.
         * @param {Array} args The Array of arguments to pass to the handler function.
         */
        error: function(name, args) {
            if (this.error_handlers[name] != "undefined") {
                this.error_handlers[name].apply(this, args || []);
            }
        },
        
        /**
         * Convenience function for triggering events.
         * 
         * <p>
         *   Note that this function automatically wraps handlers in the
         *   namespace of the current instance.
         * </p>
         * 
         * @param {String} name The name of the event handler.
         * @param {Array} args The Array of arguments to pass to the handler function.
         */
        trigger: function(name, args) {
            this.$wrapper.triggerHandler([name, this.name].join("."), args || []);
        },
        
        /**
         * Sets properties for the rows and columns of the table.
         * 
         * <p>
         *   Each row or column in the table may have any number of properties
         *   assigned to it.  These properties are passed into the plugin upon
         *   initialization as {@link jQuery.tabulate.options.rows} for rows, and
         *   {@link jQuery.tabulate.options.columns} for columns.  The following
         *   outlines valid properties for both rows and columns (note that
         *   "cell" refers to a column within a row):
         * </p>
         * 
         * <ul>
         *   <li>
         *     <strong>name</strong> - The name associated with the current cell
         *     or row.  In the case of an object, this would be the key.  In the
         *     case of an Array, this would be the index.
         *   </li>
         *   <li>
         *     <strong>data</strong> - The data associated with the current row.
         *     It can be used for extracting the value of a key and storing it
         *     as the cell's content.
         *   </li>
         *   <li>
         *     <strong>args</strong> - An array of arguments to pass to the
         *     callback function via javaScript's apply function.
         *   </li>
         *   <li>
         *     <p>
         *       <strong>callback</strong> - This is a function that will be
         *       called when the cell or row is instantiated.  This is useful
         *       for manipulating something based on the data assigned to a cell
         *       or row.  Inside of the this function, <em>this</em> is equal to
         *       {@link jQuery.tabulate}.  The arguments passed to this function vary
         *       between cells and rows.
         *     </p>
         *     
         *     <p>The arguments passed for a row are:</p>
         * 
         *     <ul>
         *       <li>
         *         <strong>$row</strong> - The jQuery object representing the
         *         current row.
         *       </li>
         *       <li>
         *         <strong>row_data</strong> - The data associated with the current
         *         row.
         *       </li>
         *     </ul>
         * 
         *     <p>The arguments passed for a cell are:</p>
         * 
         *     <ul>
         *       <li>
         *         <strong>$row</strong> - The jQuery object representing the
         *         current row.
         *       </li>
         *       <li>
         *         <strong>$cell</strong> - The jQuery object representing the
         *         current cell.
         *       </li>
         *       <li>
         *         <strong>$content</strong> - The jQuery object representing
         *         $cell's content wrapper.
         *       </li>
         *       <li>
         *         <strong>row_data</strong> - The data associated with the
         *         current row.
         *       </li>
         *     </ul>
         *   </li>
         *   <li>
         *     <strong>event_handlers</strong> - An object containing event
         *     handlers to bind to the cell or row.  These should be defined in
         *     the same format as {@link jQuery.tabulate.event_handlers}.
         *   </li>
         *   <li>
         *     <strong>styles</strong> - An object containing style information
         *     to be applied to the row or cell. This object is passed to the
         *     <a href="http://api.jquery.com/jQuery.css/">jQuery.css</a>
         *     function.
         *   </li>
         * </ul>
         * 
         * <p>
         *   Columns may also contain these properties, in addition to those
         *   defined above:
         * </p>
         * 
         * <ul>
         *   <li>
         *     <strong>$content</strong> - The jQuery object in which to append
         *     content inside of. If not given, defaults to $element.
         *   </li>
         *   <li>
         *     <strong>content</strong> - The content to append inside $content.
         *     Content can be passed in as a string, a jQuery object, or as a
         *     key within the dataset <em>data</em>. If you wish to pass in a
         *     key, you may do so within curly braces like so: "{some_key}".  If
         *     the key is nested within the dataset, you may separate each level
         *     by use of a dot like so: "{obj.prop.key}".
         *   </li>
         * </ul>
         * 
         * @see <a href="http://api.jquery.com/jQuery.css/">jQuery.css</a>
         * @see <a href="https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Function/apply">Function.apply</a>
         * @see jQuery.tabulate.options.rows
         * @see jQuery.tabulate.options.columns
         * @see jQuery.tabulate.event_handlers
         * 
         * @param {jQuery} $element The element to apply the properties to.
         * @param {object} properties An object containing the properties.
         * 
         * @return {jQuery} The modified element
         */
        set_properties: function($element, properties) {
            if ($element && typeof properties == "object") {
                var self = this,
                    tag = $element.attr("tagName").toLowerCase();
                
                // These properties apply to cells only
                if (tag == "td") {
                    var data = properties.data || {},
                        $content = properties.$content || $element;

                    if (properties.content && properties.content.length) {
                        if (typeof properties.content == "string") {
                            $content.html(properties.content.replace(this.parse_key(), function(str, key) {
                                return $.getNestedKey(key, data) || ""; // replace with value, or empty string
                            }));
                        }
    
                        else if (properties.content instanceof jQuery) {
                            $content.append(properties.content);
                        }
                    }
                }
                
                if (typeof properties.styles == "object") {
                    $element.css(properties.styles);
                }
                
                if (typeof properties.callback == "function") {
                    properties.callback.apply(this, properties.args || []);
                }
                
                if (typeof properties.event_handlers == "object") {
                    $.each(properties.event_handlers, function(name, handler) {
                        $element.bind(name, function(event) {
                            handler.apply(self, [event, $element, data || {}]);
                        });
                    });
                }
            }
            
            return $element;
        },
        
        /**
         * Gathers the data needed for tabulation.
         * 
         * <p>
         *   Data can either be passed in explicitly or loaded via jQuery.ajax.
         *   This function expects a "request" parameter, however, if none is
         *   passed it will use the default data request object that was passed
         *   into tabulate upon initialization.
         * </p>
         * 
         * <p>
         *   If a request is found, this function will trigger
         *   {@link jQuery.tabulate.event_handlers.event:loading} with <em>true</em>
         *   as its argument, effectively turning it on. After the data type is
         *   determined and the data has been gathered this function will
         *   trigger {@link jQuery.tabulate.event_handlers.event:post_load} with the
         *   data object as its argument.  It is important to note that if both
         *   an AJAX request and a JSON object are passed to this function, the
         *   result of the two will be merged together before being passed to
         *   the post_load event handler.
         * </p>
         * 
         * @see jQuery.tabulate.options.data
         * @see jQuery.tabulate.event_handlers
         * 
         * @param {object} request The request object.
         * @param {object} filters Filters that will apply to this request only.
         */
        load: function(request, filters) {
            request = request || this.data;
            
            if (request) {
                this.trigger("loading", [true]);

                // use AJAX load to get our data
                if (typeof request.ajax == "object" && !$.isEmpty(request.ajax)) {
                    var self = this;

                    // update filters
                    filters = $.extend(true, {}, this.filters, filters);
                    
                    // merge request with additional internal arguments
                    var request = $.extend(true, {}, request.ajax, {
                        data: filters,
                        cache: this.cache_requests,
                        success: function(data) {
                            // merge in static JSON content, if any
                            $.extend(true, data, request.json || {});
                            
                            // fire post load handler
                            self.trigger("post_load", [data]);
                        },
                        error: function() {
                            self.error("ajax", arguments);
                        }
                    });
                    
                    // fire AJAX request
                    $.ajax(request);
                }
    
                // use static JSON data
                else if (typeof request.json == "object" && !$.isEmpty(request.json)) {
                    this.trigger("post_load", [request.json]);
                }
            }
        },

        /**
         * Given data, builds a tabular view of that data.
         * 
         * <p>
         *   This is the heart and soul of the tabulate plugin.  The data fed to
         *   this plugin is generally fed from the {@link jQuery.tabulate.load}
         *   function, but data may be passed directly in from another source if
         *   needed.  Just be sure that you have mapped your keys correctly upon
         *   initialization.
         * </p>
         * 
         * <p>
         *   Apart from generating the table, this function also clears out any
         *   previous table data, updates any statistical information (such as
         *   the record count and number of pages) and applies any additional
         *   properties to rows and columns via the {@link jQuery.tabulate.set_properties}
         *   function.  Helpful identifying classes are also added for
         *   convenience, such as "first" and "last" for the first and last row
         *   or column, and "odd" and "even" for odd and even numbered rows.
         * </p>
         * 
         * <p>
         *   If for some reason we were not able to locate the rows data, most
         *   likely due to a missing or erroneous key, or an empty result set,
         *   table generation will be skipped and a message will be logged to
         *   the console (assuming it is enabled).  Finally, this function will
         *   fire the {@link jQuery.tabulate.event_handlers.event:loading} event handler,
         *   passing in false as an argument, effectively turning it off, and
         *   then fire the {@link jQuery.tabulate.event_handlers.event:post_tabulate}
         *   handler for any additional post-processing.
         * </p>
         * 
         * @see jQuery.tabulate.event_handlers
         * @param {object} data The JSON data to tabulate upon.
         */
        tabulate: function(data) {
            var self = this,
                $row = this.fragments.$row.clone(),
                rows = $.getNestedKey(this.keys.rows, data) || {},
                columns = $.getNestedKey(this.keys.columns, data) || {};

            // store data statistics
            this.count = data[this.keys.count] || $.getLength(rows);
            this.total_pages = Math.ceil(this.count / this.filters.limit) || 1;

            // clear out the old data
            this.$head.empty();
            this.$body.empty();
            
            // rows is empty or missing
            if ($.isEmpty(rows)) {
                this.error("tabulate", arguments);
            }

            // we've got data to work with
            else {
                // build table head
                $.each(this.columns, function(c, column) {
                    var c = ($.isNumber(c) ? parseInt(c) + 1 : c),
                        $cell = self.fragments.$cell.clone(),
                        $content = self.fragments.$content.clone(),
                        properties = $.extend({}, {
                            args: [$row, $cell, $content],
                            data: $.getNestedKey(c, columns),
                            name: c,
                            $content: $content
                        }, column.head);

                    $cell.attr("id", self.name + "-column-" + c + "-head")
                        .addClass("column-" + c);
                 
                    self.set_properties($cell, properties);
                    $row.append($cell.append($content));
                });

                $row.find("td:first").addClass("tabulate-cell-first");
                $row.find("td:last").addClass("tabulate-cell-last");
                
                this.$head.append($row);
    
                // build table body
                $.each(rows, function(r, row_data) {
                    var r = ($.isNumber(r) ? parseInt(r) + 1 : r),
                        render = false, // whether or not to append this row
                        $row = self.fragments.$row.clone();
                    
                    // build cells
                    $.each(self.columns, function(c, column_data) {                    
                        var c = ($.isNumber(c) ? parseInt(c) + 1 : c),
                            $cell = self.fragments.$cell.clone(),
                            $content = self.fragments.$content.clone(),
                            properties = $.extend({}, {
                                data: row_data,
                                args: [$row, $cell, $content, row_data],
                                name: c,
                                $content: $content
                            }, column_data.body);
                        
                        $cell.hover(function() {
                            $(this).addClass("tabulate-cell-hover");
                        }, function() {
                            $(this).removeClass("tabulate-cell-hover");
                        });
                        
                        $cell.attr("id", self.name + "-column-" + c + "-body")
                            .data("location", {row: r, column: c})
                            .addClass("column-" + c);
    
                        self.set_properties($cell, properties);
                        $row.append($cell.append($content));
                        
                        // set render to true if we have cell content
                        if (!render && $content.html()) render = true;
                    });
    
                    // at least one column needs content to append row
                    if (render) {
                        var properties = $.extend({}, {
                                data: row_data,
                                args: [$row, row_data],
                                name: r
                            }, self.rows);

                        $row.hover(function() {
                            $(this).addClass("tabulate-row-hover");
                        }, function() {
                            $(this).removeClass("tabulate-row-hover");
                        });

                        $row.find("td:first").addClass("tabulate-cell-first");
                        $row.find("td:last").addClass("tabulate-cell-last");
                        
                        $row.attr("id", self.name + "-row-" + r)
                            .data("data", row_data);
                        
                        self.set_properties($row, properties);
                        self.$body.append($row);
                    }
                });

                this.$body.find("tr:odd").addClass("tabulate-row-odd");
                this.$body.find("tr:even").addClass("tabulate-row-even");
                this.$body.find("tr:first").addClass("tabulate-row-first");
                this.$body.find("tr:last").addClass("tabulate-row-last");
            }
            
            // fire handlers
            this.trigger("loading", [false]);
            this.trigger("post_tabulate", [data]);
        },
        
        /**
         * Custom event handlers for tabulate.
         * 
         * <p>
         *   Each event handler is a key/value pair, where the key represents
         *   the name of the event, prefixed by the name of the class instance
         *   and the name assigned to the row/cell, and the value should be the
         *   callback function to be executed when the event is fired.
         * </p>
         * 
         * <p>
         *   The defined callback function will be invoked using javaScript's
         *   built-in "apply" function, meaning it can take an arbitrary amount
         *   of arguments that will be passed directly to the callback function.
         * </p>
         * 
         * <p>
         *   Each of these default handlers may be overwritten by the user as
         *   they see fit by passing new callback functions into the options
         *   object upon class initialization.
         * </p>
         * 
         * @see jQuery.tabulate.options.event_handlers
         * @type object
         * @namespace Contains the event handlers for {@link jQuery.tabulate}
         */
        event_handlers: {
            /**
             * Generally called when data needs to be re-loaded.
             * 
             * <p>
             *   By default, triggers {@link jQuery.tabulate.load}.
             * </p>
             * 
             * @event
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param {object} event The jQuery Event Object
             * @param {object} data The data source to use ({@link $.tabulate.data} by default).
             * @param {object} filters Filters to apply to this load request only.
             */
            refresh: function(event, data, filters) {
                this.load(data || this.data, filters || {});
            },
            
            /**
             * Toggles the loading element.
             * 
             * <p>
             *   Adds or removes the "loading" class from said element.  If the
             *   <em>bool</em> parameter is not passed, the class will be
             *   toggled.
             * </p>
             * 
             * @event
             * @see jQuery.tabulate.options.elements.$loading
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param {object} event The jQuery Event Object
             * @param {boolean} bool Whether to enable or disable loading.
             */
            loading: function(event, bool) {
                if (typeof bool == "boolean") {
                    this.elements.$loading[(bool ? "addClass" : "removeClass")]("loading");
                } else {
                    this.elements.$loading.toggleClass("loading");
                }
            },
            
            /**
             * Called after {@link jQuery.tabulate.init} finishes processing.
             * 
             * <p>
             *   By default, this function applies the colSpan property to the
             *   footer of the table, populates the results-per-page dropdown,
             *   and then triggers {@link jQuery.tabulate.event_handlers.event:refresh}.
             * </p>
             * 
             * @event
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param {object} event The jQuery Event Object
             */
            post_init: function(event) {
                var self = this;

                // add colspan to footer (note the capital S in colSpan, IE/jQuery bug!)
                this.$foot.find(".tabulate-cell").attr("colSpan", $.getLength(this.columns));
                
                // build results per page dropdown
                $.each(this.results_per_page, function(i, value) {
                    self.elements.$results_per_page.append(
                        self.fragments.$option.clone().val(value).text(value)
                    );
                });
                
                // load our data
                this.trigger("refresh");
            },
            
            /**
             * Called after {@link jQuery.tabulate.load} finishes processing.
             * 
             * <p>
             *   By default, triggers {@link jQuery.tabulate.tabulate}.
             * </p>
             * 
             * @event
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param {object} event The jQuery Event Object
             */
            post_load: function(even, data) {
                this.tabulate(data);
            },
            
            /**
             * Called after {@link jQuery.tabulate.tabulate} finishes processing.
             * 
             * <p>
             *   By default, updates statistical information in the footer.
             * </p>
             * 
             * @event
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param {object} event The jQuery Event Object
             * @param {object} data The data object that was passed into {@link jQuery.tabulate.tabulate}.
             */
            post_tabulate: function(event, data) {
                this.elements.$count.text(this.count);
                this.elements.$total_pages.text(this.total_pages);
                this.elements.$current_page.val(this.current_page);
            }
        },
        
        /**
         * Custom error handlers for tabulate.
         * 
         * <p>
         *   If tabulate encounters an error, it will generally pass it on to
         *   these functions.  These may be overridden by the user upon class
         *   initialization.
         * </p>
         * 
         * @type object
         * @namespace Contains the error handlers for {@link jQuery.tabulate}
         */
        error_handlers: {
            /**
             * Handles AJAX request errors generated in {@link jQuery.tabulate.load}.
             * 
             * <p>
             *   This function is generally called if an AJAX request failed to
             *   reach the controller for some reason.  Make sure the URL you
             *   are using is correct.
             * </p>
             * 
             * @see <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a>
             * 
             * @param {object} XMLHttpRequest The XMLHttpRequest Object
             * @param {string} textStatus A String describing the type of error that occurred
             * @param {exception} errorThrown An exception object, if one occurred
             */
            ajax: function(XMLHttpRequest, textStatus, errorThrown) {
                // log error information to console
                console.log(this.toString() + " Error: " + textStatus, XMLHttpRequest, errorThrown);

                // alert the user with the status code and text.
                alert(XMLHttpRequest.status + ": " + (XMLHttpRequest.statusText || "Unknown error."));
            },
            
            /**
             * Handles errors generated in {@link jQuery.tabulate.tabulate}.
             * 
             * <p>
             *   This function will be called if the rows key was not found in
             *   the dataset, or if the value returned by that key was empty.
             * </p>
             * 
             * @param {object} data The data that was passed into {@link jQuery.tabulate.tabulate}.
             */
            tabulate: function(data) {
                console.log(this.toString() + " Warning: '" + this.keys.rows + "' is empty or missing.");
            }
        }
    };
})(jQuery);