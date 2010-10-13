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
 * @version 2.2.20101008
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
;(function($) {    
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
         * Contains any data that has already been loaded.
         * 
         * @type Object
         */
        cache: {},

        /**
         * The current number of rows in the data set.
         * 
         * <p>
         *   This value is set by counting the number of "data" items within
         *   the returned data set.
         * </p>
         * 
         * @see jQuery.tabulate.keys.data
         * 
         * @default 0
         * @type Number
         */
        current_count: 0,
        
        /**
         * The "page" of the data set that is currently being viewed.
         * 
         * <p>
         *   Used by the internal pagination system to limit the current view of
         *   the data set.  This variable is modified by the navigation functions.
         * </p>
         * 
         * @default 1
         * @type Number
         */
        current_page: 1,

        /**
         * The total number of rows in the data set.
         * 
         * <p>
         *   This value may be set within the data set to allow for lazy-loading
         *   data (not loading it all at once).
         * </p>
         * 
         * @see jQuery.tabulate.keys.count
         * 
         * @default 0
         * @type Number
         */
        total_count: 0,

        /**
         * The total number of "pages" in the data set that are available for
         * viewing.
         * 
         * <p>
         *   This value is calculated in {@link jQuery.tabulate.tabulate} based upon
         *   the values of {@link jQuery.tabulate.count} and {@link jQuery.tabulate.filters.limit}.
         * </p>
         * 
         * @default 1
         * @type Number
         */
        total_pages: 1,

        /**
         * The number of columns in the table (at its widest point).
         * 
         * @default 0
         * @type Number
         */
        columns: 0,

        /**
         * Global filters to apply to the data set will go here.
         * 
         * @namespace Contains filters to apply to the data set.
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
             * The number of items by which to offest our data set.
             * 
             * @default 0
             * @type integer
             */
            offset: 0
        },
        
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
             * Whether or not to enable debug mode.
             * 
             * @default false
             * @type Boolean
             */
            debug: false,

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
             * @return RegExp The RegExp object
             */
            parse_key: function() {
                return new RegExp(/\{([^{}]+)\}/g);
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
                 * @default window.location.pathname.replace(/\/$/, '')
                 * @type String
                 */
                tabulate: window.location.pathname.replace(/\/$/, ''),

                /**
                 * The default path to the theme.
                 * 
                 * <p>
                 *   Please note that this path is relative to
                 *   {@link jQuery.tabulate.options.paths.tabulate}.
                 * </p>
                 * 
                 * @default "src/themes/default"
                 * @type String
                 */
                theme: "src/themes/default",
                
                /**
                 * Contains the paths to images, relative to the current theme.
                 * 
                 * @namespace The paths to images needed by tabulate.
                 */
                images: {
                    /**
                     * The "previous" image.
                     * 
                     * @type String
                     * @default "images/prev.png"
                     */
                    previous: "images/prev.png",
                    
                    /**
                     * The "next" image.
                     * 
                     * @type String
                     * @default "images/next.png"
                     */
                    next: "images/next.png"
                }
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
                 * Contains data sources to work upon.
                 * 
                 * <p>
                 *   Data sources are defined as a key/value pair within the
                 *   source object.  The following are valid data sources:
                 * </p>
                 * 
                 * <ul>
                 *   <li>
                 *     <strong>json</strong> - Pure JSON data. Example: <br />
                 *     <code>
                 *         {
                 *             count: 1234,
                 *             some_other_data: "data",
                 *             more_custom_data: "not needed by tabulate",
                 *             rows: [
                 *                 {
                 *                     "col1": "row 1 column 1 data",
                 *                     "col2": "row 1 column 2 data",
                 *                     "col3": "row 1 column 3 data"
                 *                 }
                 *                 ...
                 *                 {
                 *                     "col1": "row 50 column 1 data",
                 *                     "col2": "row 50 column 2 data",
                 *                     "col3": "row 50 column 3 data"
                 *                 }
                 *             ]
                 *         }
                 *     </code>
                 *   </li>
                 *   <li>
                 *     <strong>ajax</strong> - A  <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a> request object.<br /><br />
                 *     These settings that will be passed into the native jQuery.ajax function.
                 *     Any of the options available to that function may be used
                 *     here, with the exception of the "success" and "error"
                 *     functions, which are overridden internally. Example: <br />
                 *     <code>
                 *         {
                 *             url: "/path/to/controller",
                 *             data: { method: "some_method" },
                 *             dataType: "json"
                 *         }
                 *     </code>
                 *   </li>
                 * </ul>
                 * 
                 * @type Object
                 * @namespace Holds information about the source of our data.
                 */
                source: {},
                
                /**
                 * These filters will be attached to the data set.  They may
                 * override any global filter values, but the global filters
                 * will always be present (whether or not their values are
                 * overwritten).
                 * 
                 * @namespace Contains filters to apply to the data set.
                 */
                filters: {}
            },

            /**
             * Contains the sections of the table and their settings.  By default,
             * the sections "head", "body" and "foot" have been defined for you.
             * You may use these sections for your table, overwrite them, or
             * define your own.
             * 
             * Valid settings include:
             * 
             * <ul>
             *   <li>
             *     <strong>container</strong><br /><br />
             *     The container for this section.  Can be a string containing
             *     HTML or a jQuery object.
             *   </li>
             *   <li>
             *     <strong>key</strong><br /><br />
             *     The key in your data set to bind to this section.  This should
             *     point to the data you want to build the section out with.  By
             *     default, the name of the section will be used as the key.
             *   </li>
             *   </li>
             *     <strong>rows</strong><br /><br />
             *     Properties to assign to the rows in this section.
             * 
             *     Valid row properties include any of the following:
             * 
             *     <ul>
             *       <li>
             *         <strong>content</strong><br /><br />
             *         May be used to set the content of the cells within the
             *         row.  The content property accepts any of the following:
             *         a jQuery object, HTML, a String, a Number or a Function
             *         returning one of the previously stated types.  If a 
             *         function is given, three arguments will be passed in:
             *         $row (the current row, wrapped in a jQuery object),
             *         $content (the content areas of the cells within the row,
             *         wrapped in a jQuery object), and data (any data associated
             *         with the current row).
             *       </li>
             *       <li>
             *         <strong>filter</strong><br /><br />
             *         May be used to set additional properties on the row
             *         (including attributes, styles, events, etc).  This
             *         property only accepts a function.  Three arguments 
             *         will be available at runtime: $row (the current row,
             *         wrapped in a jQuery object), $content (the content areas
             *         of the cells within the row, wrapped in a jQuery object),
             *         and data (any data associated with the current row).
             *       </li>
             *     </ul>
             *   </li>
             *   <li>
             *     <strong>cells</strong><br /><br />
             *     
             *     Properties to assign to the columns in this section.
             * 
             *     Valid cell properties include any of the following:
             * 
             *     <ul>
             *       <li>
             *         <strong>content</strong><br /><br />
             *         May be used to set the content of the cell.  The
             *         content property accepts any of the following: a
             *         jQuery object, HTML, a String, a Number or a Function
             *         returning one of the previously stated types.  If a 
             *         function is given, three arguments will be passed in:
             *         $cell (the current cell, wrapped in a jQuery object),
             *         $content (the content area of that cell, wrapped in a
             *         jQuery object), and data (any data associated with the
             *         current cell).
             *       </li>
             *       <li>
             *         <strong>filter</strong><br /><br />
             *         May be used to set additional properties on the cell
             *         (including attributes, styles, events, etc).  This
             *         property only accepts a function.  Three arguments 
             *         will be available at runtime: $cell (the current cell,
             *         wrapped in a jQuery object), $content (the content area
             *         of that cell, wrapped in a jQuery object), and data
             *         (any data associated with the current cell).
             *       </li>
             *     </ul>
             *   </li>
             * </ul>
             * 
             * <p>
             *   Note that even if a section is defined, it will only be shown
             *   if it has data associated with it.
             * </p>
             * 
             * @type Object
             * @namespace
             */
            table: {
                head: {
                    container: $('<thead class="tabulate-header"></thead>')
                },
                body: {
                    container: $('<tbody class="tabulate-body"></tbody>')
                },
                foot: {
                    container: $('<tfoot class="tabulate-footer"></tfoot>')
                }
            },

            /**
             * Keys help tabulate find relevant information in your data set.
             * 
             * @type Object
             * @namespace Contains the names of keys in the data set.
             */
            keys: {
                /**
                 * The key containing the core table data.  This should be the
                 * data you wish to paginate upon.
                 * 
                 * @default "body"
                 * @type String
                 */
                data: "body",

                /**
                 * The key that will store the total record count.
                 * 
                 * <p>
                 *   This key can point to an integer value or an array (in which
                 *   case the length of the array will be used).
                 * </p>
                 * 
                 * @default String "count"
                 */
                count: "count"
            },
            
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
                 * The "loading" element.  This element is activated whenever
                 * tabulate is loading data.
                 * 
                 * @type String
                 */
                $loading: ".tabulate-loading",

                /**
                 * The "previous" element.  This element is bound to the
                 * {@link jQuery.tabulate.previous} function.
                 * 
                 * @type String
                 */
                $previous: ".tabulate-prev",

                /**
                 * The "next" element.  This element is bound to the
                 * {@link jQuery.tabulate.next} function.
                 * 
                 * @type String
                 */
                $next: ".tabulate-next",

                /**
                 * The "count" element.  This element stores the value of the
                 * {@link jQuery.tabulate.count} variable.
                 * 
                 * @type String
                 */
                $count: ".tabulate-count",

                /**
                 * The "total pages" element.  This element stores the value of
                 * the {@link jQuery.tabulate.total_pages} variable.
                 * 
                 * @type String
                 */
                $total_pages: ".tabulate-total-pages",

                /**
                 * The "current page" element.  This element stores the value
                 * of the {@link jQuery.tabulate.current_page} variable.
                 * 
                 * @type jQuery
                 */
                $current_page: ".tabulate-current-page",

                /**
                 * The "results per page" element.  This element is bound to the
                 * {@link jQuery.tabulate.update_filters} function, specifically
                 * for updating the "limit" filter.
                 * 
                 * @type String
                 */
                $results_per_page: ".tabulate-results-per-page"
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
                 * Default content element.
                 * 
                 * @type jQuery
                 */
                $content: $('<div class="tabulate-content"></div>'),

                /**
                 * Default container element.
                 * 
                 * @type jQuery
                 */
                $container: $('<table class="tabulate-container"></table>'),

                /**
                 * Default navigation for the table.
                 * 
                 * @type jQuery
                 */
                $navigation: $(
                    [
                        '<div class="tabulate-navigation clearfix">',
                        '    <div class="tabulate-partition tabulate-partition-first tabulate-pagination">',
                        '        <img class="tabulate-prev" />',
                        '        page <input class="tabulate-current-page" type="text" />',
                        '        of <span class="tabulate-total-pages"></span>',
                        '        <img class="tabulate-next" />',
                        '    </div>',
                        '    <div class="tabulate-partition tabulate-partition-no-input">',
                        '        <span class="tabulate-count">0</span> total results',
                        '    </div>',
                        '    <div class="tabulate-partition tabulate-partition-no-input">',
                        '        <div class="tabulate-loading"><span>Loading...</span></div>',
                        '    </div>',
                        '    <div class="tabulate-partition tabulate-partition-last">',
                        '        <select class="tabulate-results-per-page"></select> results per page',
                        '    </div>',
                        '</div>',
                    ].join('')
                )
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
            error_handlers: {}
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
         * @param jQuery $wrapper The element(s) passed in from {@link jQuery.fn.tabulate}.
         * @param object options Options to overwrite the default ones with.
         */
        init: function($wrapper, options) {            
            var self = this;

            // extend default options, then attach to this instance
            $.extend(true, this.options, options || {});
            $.extend(true, this, this.options);
            $.extend(this, {
                $navigation: this.fragments.$navigation.clone(),
                $container: this.fragments.$container.clone(),
                $wrapper: $wrapper
            });
            
            // build container
            this.$wrapper.append(this.$container).append(this.$navigation);
            
            // generate full themes path
            this.paths.theme = [this.paths.tabulate, this.paths.theme].join("/");

            // set limit to first item in results per page array, if not set
            this.filters.limit = this.filters.limit || this.results_per_page[0];
            
            // Build out elements
            $.each(this.elements, function(key, value) {
                self.elements[key] = $(value, $wrapper);
            });

            // navigation: previous
            if (this.elements.$previous.length) {
                this.elements.$previous.attr({
                    src: [this.paths.theme, this.paths.images.previous].join("/"),
                    alt: "Previous Page",
                    title: "Previous Page"
                }).click(function() {
                    self.previous(this); return false;
                });
            }

            // navigation: next
            if (this.elements.$next.length) {
                this.elements.$next.attr({
                    src: [this.paths.theme, this.paths.images.next].join("/"),
                    alt: "Next Page",
                    title: "Next Page"
                }).click(function() {
                    self.next(this); return false;
                });
            }

            // navigation: current page
            if (this.elements.$current_page.length) {
                this.elements.$current_page.keyup(function(event) {
                    var page = parseInt($(this).val());

                    if (!isNaN(page) && event.which == 13) {
                        self.go_to(page);
                    }
                });
            }

            // navigation: results per page
            if (this.elements.$results_per_page.length) {
                $.each(this.results_per_page, function(i, value) {
                    self.elements.$results_per_page.append(
                        self.fragments.$option.clone().val(value).text(value)
                    );
                });

                // handle results per page change
                this.elements.$results_per_page.change(function() {
                    var limit = parseInt($(this).val());

                    if (!isNaN(limit)) {
                        self.filters.limit = limit;
                        self.trigger("reset");
                    }
                });
            }

            // bind event handlers
            $.each(this.event_handlers, function(name, handler) {
                self.$wrapper.bind([name, self.name].join("."), function() {
                    handler.apply(self, arguments);
                });
            });

            // done with initialization
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
                this.filters.offset = ((this.current_page - 1) * this.filters.limit);
                this.trigger("refresh");
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
         * @param element element The DOM element that was clicked.
         */
        next: function(element) {
            if (this.current_page < this.total_pages) {
                this.current_page++;
                this.filters.offset = ((this.current_page - 1) * this.filters.limit);
                this.trigger("refresh");
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
         * @param integer page An integer value specifying the page to go to.
         */
        go_to: function(page) {
            if (page >= 1 && page <= this.total_pages) {                
                this.current_page = page;
                this.filters.offset = ((this.current_page - 1) * this.filters.limit);
                this.trigger("refresh");
            }
        },

        /**
         * Updates the filters that will be applied to the current data set.
         * 
         * @param Object filters The filters to apply to the data set.
         * @param Boolean overwrite Whether or not to overwrite the current filters
         *        with the new filters. Defaults to true.  If false, the two filter
         *        objects would be merged.
         * @param Object refresh Whether or not to call the refresh handler.
         *        Defaults to true.
         */
        update_filters: function(filters, overwrite, refresh) {
            filters = filters || {};

            if (overwrite !== false) {
                this.data.filters = filters;
            } else {
                $.extend(true, this.data.filters, filters || {});
            }

            if (refresh !== false) {
                this.trigger("refresh");
            }
        },

        /**
         * Convenience function for displaying error information.
         */
        error: function() {
            if (this.debug && window.console && window.console.log) {
                window.console.log("jquery.tabulate [error]: ", arguments);
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
         * @param String name The name of the event handler.
         * @param Array args The Array of arguments to pass to the handler function.
         */
        trigger: function(name, args) {
            this.$wrapper.triggerHandler([name, this.name].join("."), ($.isArray(args) ? args : (args ? [args] : [])));
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
         * @param Object request The request object.
         * @param Object filters Filters that will apply to this request only.
         */
        gather_data: function(request, filters) {
            var self = this,
                request = request || {},
                filters = filters || {};

            // gather JSON data via AJAX request
            if (request.ajax) {
                filters = $.extend(true, {}, this.filters, this.data.filters, filters);

                // merge request with additional internal arguments
                var request = $.extend(true, {}, request.ajax, {
                    data: filters,
                    success: function(data) {
                        $.extend(true, data, request.json || {});

                        // TODO: not truly cached, because if results_per_page
                        // changes, cache is cleared.  so only semi-cached.
                        $.each(data, function(key, value) {
                            if (!self.cache[key] || !$.isArray(value)) {
                                self.cache[key] = value;
                            } else {
                                $.merge(self.cache[key], value);
                            }
                        });

                        self.trigger("loading", false);
                        self.trigger("post_load", self.cache);
                    },
                    error: function() {
                        self.error_handlers.ajax.apply(self, arguments);
                    }
                });

                this.trigger("loading", true);
                $.ajax(request);
            }

            // Use JSON data we already have
            else if (request.json) {
                this.trigger("post_load", request.json);
            }
        },

        /**
         * Given data, builds a tabular view of that data.
         * 
         * <p>
         *   This function fires {@link jQuery.tabulate.post_tabulate} when
         *   it finishes.
         * </p>
         * 
         * @param Object data The object containing the data to tabulate.
         */
        tabulate: function(data) {
            var self = this,
                data = data || {};

            // get count of paginatable results
            this.current_count = $.getLength(data[this.keys.data]) || 0;

            // for total count, use count key if given, otherwise use current count
            this.total_count = parseInt(data[this.keys.count]) || this.current_count;
            
            // total pages = count / limit (or 1, if count or limit = 0)
            this.total_pages = Math.ceil(this.total_count / this.filters.limit) || 1;

            // current page = offset / limit + 1
            this.current_page = Math.floor(this.filters.offset / this.filters.limit) + 1;

            // clear out the old data
            this.$container.children().empty();

            // if total count is zero, we have nothing to tabulate
            if (this.total_count === 0) {
                this.trigger("no_results");
            } else {
                $.each(this.table, function(section, options) {
                    self.build_section(section, options, $.getObject(options.key || section, data) || []);
                });
            }
            
            // fire post_tabulate handler
            this.trigger("post_tabulate", data);
        },

        /**
         * Builds and appends a section of the table.
         * 
         * @param String section The name of the section
         * @param Object options Contains the section key, $section fragment
         *        and any additional properties to bestow upon the section.
         * @param Object data The data given to tabulate
         */
        build_section: function(name, options, data) {
            // if no containing element is given, there is nothing to do
            if (!options.container || !options.container.length)
                return;

            var self = this,
                $section = options.container.clone(),
                data = data.slice(this.filters.offset, this.filters.offset + this.filters.limit);

            // append section to table
            this.$container.append($section);

            // build rows
            $.each(data, function(r, row) {
                var empty = true,
                    r = r.toString(),
                    $row = self.fragments.$row.clone();

                // build cells
                $.each(row, function(c, cell) {
                    var c = c.toString(),
                        $cell = self.fragments.$cell.clone(),
                        $content = self.fragments.$content.clone();

                    $cell.append($content);

                    self.apply_properties($cell, {
                        key: c,
                        type: "column",
                        dataset: data[r]
                    }, $.getObject(c, options.cells));

                    // append to row, add hover classes (for IE)
                    $row.append($cell.hover(
                        function() { $(this).addClass("tabulate-hover"); },
                        function() { $(this).removeClass("tabulate-hover"); }
                    ));

                    // set render to true if we have cell content
                    if (empty && $content.html()) empty = false;
                });

                // at least one cell needs content to append row
                if (!empty) {
                    self.apply_properties($row, {
                        key: r,
                        type: "row",
                        dataset: data
                    }, $.getObject(r, options.rows));

                    $row.children(":odd").addClass("tabulate-even");
                    $row.children(":even").addClass("tabulate-odd");
                    $row.children(":first").addClass("tabulate-first");
                    $row.children(":last").addClass("tabulate-last");

                    $section.append($row);
                }
            });

            $section.children(":odd").addClass("tabulate-even");
            $section.children(":even").addClass("tabulate-odd");
            $section.children(":first").addClass("tabulate-first");
            $section.children(":last").addClass("tabulate-last");

            // update column count
            this.columns = Math.max(this.columns, data.length);
        },

        /**
         * Applies properties to rows and cells in the table.
         * 
         * @see jQuery.table.body.rows
         * @see jQuery.table.body.cells
         * 
         * @param jQuery $element The element to apply the properties to.
         * @param Object settings An object containing settings for the
         * 
         * @return jQuery The modified element
         */
        apply_properties: function($element, settings, properties) {
            var self = this,
                dataset = settings.dataset || {},
                key = (typeof settings.key !== "undefined" ? settings.key : "");

            $element.each(function(i, element) {
                var $element = $(element),
                    $content = $(".tabulate-content", $element),
                    data = (dataset[key] ? dataset[key] : dataset),
                    name = ($.isNumber(key) ? parseInt(key) + 1 : key),
                    args = ($content.length ? [$element, $content, data] : [$element, data]),
                    props = (properties
                        ? (typeof properties === "object" ? properties : { content: properties })
                        : (typeof data === "object" ? {} : { content: data })
                    );

                // apply type class
                if (typeof settings.type == "string") {
                    $element.addClass([self.name, settings.type, name].join("-"));
                }

                $.each(props, function(property, value) {
                    switch(property) {
                        // jQuery Object, HTML, String or Function (returning one of those types) supported
                        case "content": {
                            if ($content.length) {
                                if (value instanceof $) {
                                    $content.append(value);
                                } else {
                                    $content.append((typeof value === "function" ? value.apply(self, args) : value)
                                        .replace(self.parse_key(), function(str, key) {
                                            return $.getObject(key, dataset) || "";
                                        })
                                    );
                                }
                            }
                            break;
                        }
                        case "filter": {
                            value.apply(self, args);
                            break;
                        }
                    }
                });
            });
        },

        /**
         * Contains the event handlers that are attached to the $wrapper.
         * 
         * <p>
         *   These handlers can be overridden by those passed into the plugin.
         * </p>
         * 
         * @see jQuery.tabulate.$wrapper
         * @see jQuery.tabulate.options.event_handlers
         * 
         * @namespace
         */
        event_handlers: {
            /**
             * Refresh changes the scope of the data shown.  This might mean
             * gathering and displaying new data, or simply changing the display 
             * scope of data we already have.
             * 
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * 
             * @param Object event The jQuery.Event object
             * @param Object request The data request object
             * @param Object filters Filters to apply to the request
             * 
             * @event
             */
            refresh: function(event, request, filters) {
                if ((this.current_count === 0)
                    || (this.filters.offset + this.filters.limit > this.current_count)
                    && (this.current_count < this.total_count)) {
                    this.gather_data(request || this.data.source, filters);
                } else {
                    this.tabulate(this.cache);
                }
            },

            /**
             * Shows or hides the loading element.
             * 
             * @see jQuery.tabulate.options.elements.$loading
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * 
             * @param Object event The jQuery.Event Object
             * @param Boolean bool (optional) Whether or not to show the loading
             *        element. By default, the element will be toggled.
             * 
             * @event
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
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param Object event The jQuery Event Object
             * 
             * @event
             */
            post_init: function(event) {
                this.gather_data(this.data.source);
            },

            /**
             * Called after {@link jQuery.tabulate.load} finishes processing.
             * 
             * <p>
             *   By default, triggers {@link jQuery.tabulate.tabulate}.
             * </p>
             * 
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param Object event The jQuery Event Object
             * 
             * @event
             */
            post_load: function(event, data) {
                this.tabulate(data);
            },

            /**
             * Called after {@link jQuery.tabulate.tabulate} finishes processing.
             * 
             * <p>
             *   By default, updates statistical information in the footer.
             * </p>
             * 
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param Object event The jQuery Event Object
             * @param Object data The data object that was passed into {@link jQuery.tabulate.tabulate}.
             * 
             * @event
             */
            post_tabulate: function(event, data) {
                this.elements.$count.text(this.total_count);
                this.elements.$total_pages.text(this.total_pages);
                this.elements.$current_page.val(this.current_page);
            },
            
            /**
             * Called if there was no data to tabulate upon.
             * 
             * @param Object event The jQuery Event object.
             * 
             * @event
             */
            no_results: function(event) {
                this.$navigation.before(this.fragments.$content.clone()
                    .addClass("tabulate-no-results").text("No results found")
                );
            },
            
            /**
             * Resets tabulate back to it's default state.
             * 
             * @param Object event The jQuery Event Object
             * 
             * @event
             */
            reset: function(event) {
                this.cache = {};
                this.total_count = this.current_count = 0;
                this.go_to(1);
            },
        },

        /**
         * Contains any error handlers that are needed by the plugin.
         * 
         * <p>
         *   These handlers can be overridden by those passed into the plugin.
         * </p>
         * 
         * @see jQuery.tabulate.$wrapper
         * @see jQuery.tabulate.options.error_handlers
         * 
         * @namespace
         */
        error_handlers: {
            /**
             * Handles AJAX request errors.
             * 
             * @see <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a>
             * 
             * @param Object xhr The XMLHttpRequest Object
             * @param String status A String describing the type of error that occurred
             * @param Exception error An exception object, if one occurred
             */
            ajax: function(xhr, status, error) {
                this.error(xhr, status, error);
            }
        },

        /**
         * Object.toString override
         * 
         * @return String "[object instance.name]"
         */
        toString: function() {
            return "[object " + this.name + "]";
        }
    };
    
    /*
     * Required utility functions
     * http://github.com/kflorence/misc-js/tree/master/jquery/
     */
    $.extend({
        /**
         * @function
         * @name jQuery.getLength
         * @param Mixed a The argument to test against.
         * @return Mixed Returns the length of argument or undefined if not known.
         */
        getLength: function(a) {
            if ($.isArray(a) || typeof a === "string") {
                return a.length;
            } else if (typeof a === "object") {
                var len = 0;
                $.each(a, function() {
                    len++;
                });
                return len;
            } else {
                return undefined;
            }
        },
        /**
         * @function
         * @name jQuery.isEmpty
         * @param Mixed o The argument to test against.
         * @return Boolean Returns true if argument is empty, false otherwise.
         */
        isEmpty: function(o) {
            if ($.isArray(o) || typeof o === "string") {
                return (o.length ? false : true);
            } else if (typeof o === "object") {
                for (var p in o) {
                    if (o.hasOwnProperty(p)) {
                        return false;
                    }
                }
                return true;
            } else {
                return (o ? false : true);
            }
        },
        /**
         * @function
         * @name jQuery.isNumber
         * @param Mixed n The argument to test against.
         * @return Boolean Returns true if argument is a finite number, false otherwise.
         */
        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    });
})(jQuery);

/*
 * jQuery getObject - v1.1 - 12/24/2009
 * http://benalman.com/projects/jquery-getobject-plugin/
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 * 
 * Inspired by Dojo, which is Copyright (c) 2005-2009, The Dojo Foundation.
 */
(function(a,c){var $=a.jQuery||a.Cowboy||(a.Cowboy={}),b;$.getObject=b=function(g,d,f){if(typeof g==="string"){g=g.split(".")}if(typeof d!=="boolean"){f=d;d=c}f=f||a;var e;while(f&&g.length){e=g.shift();if(f[e]===c&&d){f[e]={}}f=f[e]}return f};$.setObject=function(d,f,e){var h=d.split("."),i=h.pop(),g=b(h,true,e);return g&&typeof g==="object"&&i?(g[i]=f):c};$.exists=function(d,e){return b(d,e)!==c}})(this);