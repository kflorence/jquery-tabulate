; // prevent breaking when minified with other plugins

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

/* jQuery getLength */
(function($){$.getLength=function(a){if($.isArray(a)||typeof a==="string")return a.length;else if(typeof a==="object"){var len=0;$.each(a,function(){len++;});return len;}else return undefined;};})(jQuery);

/* jQuery isNumber */
(function($){$.isNumber=function(n){return !isNaN(parseFloat(n))&&isFinite(n);};})(jQuery);

/**
 * @fileOverview The jQuery.tabulate plugin.
 * @author <a href="mailto:kyle.florence@gmail.com">Kyle Florence</a>
 * @version 1.0.20100610
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
         * The number of columns in the table (at its widest point)
         * 
         * @default 0
         * @type integer
         */
        columns: 0,

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
            },

            /**
             * @namespace Contains the names of keys in the data set.
             */
            keys: {
                head: "head",
                body: "body",
                foot: "foot",

                /**
                 * The key that will store the total record count.
                 * 
                 * <p>
                 *   If this key is omitted, the number of results in the
                 *   data set will be used instead.
                 * </p>
                 * 
                 * @default string "count"
                 */
                count: "count"
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
                 * @type Object
                 * @namespace Holds information about the source of our data.
                 */
                source: {
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
                     * @default undefined
                     * @type Object
                     */
                    ajax: undefined,

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
                     * @default undefined
                     * @type Object
                     */
                    json: undefined
                },

                /**
                 * @namespace Contains the filters to apply to the data set.
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
                }
            },

            /**
             * @namespace Contains table sections and filters
             */
            table: {
                /**
                 * @default Object {}
                 */
                rows: {},

                /**
                 * @default Object {}
                 */
                columns: {}
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
            $elements: {
                /**
                 * The jQuery selector for the "loading" element.  This element is
                 * activated whenever tabulate is loading.
                 * 
                 * @default ".tabulate-loading"
                 * @type String
                 */
                loading: ".tabulate-loading",

                /**
                 * The jQuery selector for the "previous" element.  This element
                 * is bound to the {@link jQuery.tabulate.previous} function.
                 * 
                 * @default ".tabulate-prev"
                 * @type String
                 */
                previous: ".tabulate-prev",

                /**
                 * The jQuery selector for the "next" element.  This element is 
                 * bound to the {@link jQuery.tabulate.next} function.
                 * 
                 * @default ".tabulate-next"
                 * @type String
                 */
                next: ".tabulate-next",

                /**
                 * The jQuery selector for the "count" element.  This element
                 * stores the value of the {@link jQuery.tabulate.count} variable.
                 * 
                 * @default ".tabulate-count"
                 * @type String
                 */
                count: ".tabulate-count",

                /**
                 * The jQuery selector for the "total pages" element.  This
                 * element stores the value of the {@link jQuery.tabulate.total_pages}
                 * variable.
                 * 
                 * @default ".tabulate-total-pages"
                 * @type String
                 */
                total_pages: ".tabulate-total-pages",

                /**
                 * The jQuery selector for the "current page" element.  This
                 * element stores the value of the {@link jQuery.tabulate.current_page}
                 * variable.
                 * 
                 * @default ".tabulate-current-page"
                 * @type String
                 */
                current_page: ".tabulate-current-page",

                /**
                 * The jQuery selector for the "results per page" element.  This
                 * element is bound to the {@link jQuery.tabulate.update_filters}
                 * function, specifically for updating the "limit" filter.
                 * 
                 * @default ".tabulate-results-per-page"
                 * @type String
                 */
                results_per_page: ".tabulate-results-per-page"
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
            $fragments: {
                /**
                 * Default anchor element.
                 * 
                 * @type jQuery
                 */
                link: $('<a />'),

                /**
                 * Default image element.
                 * 
                 * @type jQuery
                 */
                image: $('<img />'),

                /**
                 * Default option element.
                 * 
                 * @type jQuery
                 */
                option: $('<option />'),

                /**
                 * Default row element.
                 * 
                 * @type jQuery
                 */
                row: $('<tr class="tabulate-row"></tr>'),

                /**
                 * Default cell element.
                 * 
                 * @type jQuery
                 */
                cell: $('<td class="tabulate-cell"></td>'),

                /**
                 * Default content element.
                 * 
                 * @type jQuery
                 */
                content: $('<div class="tabulate-content"></div>'),

                /**
                 * Default table element.
                 * 
                 * @type jQuery
                 */
                table: $('<table class="tabulate-table"></table>'),

                /**
                 * Default table head element.
                 * 
                 * @type jQuery
                 */
                head: $('<thead class="tabulate-header"></thead>'),

                /**
                 * Default table body element.
                 * 
                 * @type jQuery
                 */
                body: $('<tbody class="tabulate-body"></tbody>'),

                /**
                 * Default table foot element.
                 * 
                 * @type jQuery
                 */
                foot: $('<tfoot class="tabulate-footer"></tfoot>'),

                /**
                 * Default navigation for the table.
                 * 
                 * @type jQuery
                 */
                navigation: $(
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
                    ].join("")
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

            this.$wrapper = $wrapper;

            // store class instance in wrapper
            this.$wrapper.data("tabulate", this);

            // append theme path to tabulate path (no trailing "/")
            this.paths.theme = [this.paths.tabulate, this.paths.theme].join("/");

            // set limit to first item in results per page array, if not set
            this.data.filters.limit = this.data.filters.limit || this.results_per_page[0];

            // create table
            this.$wrapper.append(this.$table = this.$fragments.table)
                .append(this.$navigation = this.$fragments.navigation);

            // build table sections
            $.each(this.table.columns, function(section, columns) {
                self.$table[section] = self.$fragments[section]
                self.$table.append(self.$table[section]);
            });

            // build jQuery objects from selectors
            $.each(this.$elements, function(key, selector) {
                self.$elements[key] = $(selector);
            });

            // previous
            if (this.$elements.previous.length) {
                this.$elements.previous.attr({
                    src: this.paths.theme + "/prev.gif",
                    alt: "Previous Page",
                    title: "Previous Page"
                }).click(function() {
                    self.previous(this); return false;
                });
            }

            // next
            if (this.$elements.next.length) {
                this.$elements.next.attr({
                    src: this.paths.theme + "/next.gif",
                    alt: "Next Page",
                    title: "Next Page"
                }).click(function() {
                    self.next(this); return false;
                });
            }

            // current page
            if (this.$elements.current_page.length) {
                this.$elements.current_page.keyup(function(event) {
                    var page = parseInt($(this).val());

                    if (!isNaN(page) && event.which == 13) {
                        self.go_to(this, page);
                    }
                });
            }

            // results per page
            if (this.$elements.results_per_page.length) {
                $.each(this.results_per_page, function(i, value) {
                    self.$elements.results_per_page.append(
                        self.$fragments.option.clone().val(value).text(value)
                    );
                });

                this.$elements.results_per_page.change(function() {
                    var limit = parseInt($(this).val());

                    if (!isNaN(limit)) {
                        self.update_filters({limit: limit});
                    }
                });
            }

            // bind event handlers
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
                    offset: ((this.current_page - 1) * this.data.filters.limit)
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
         * @param element element The DOM element that was clicked.
         */
        next: function(element) {
            if (this.current_page < this.total_pages) {
                this.current_page++;

                this.update_filters({
                    offset: ((this.current_page - 1) * this.data.filters.limit)
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
         * @param element element The DOM element that was clicked.
         * @param integer page An integer value specifying the page to go to.
         */
        go_to: function(element, page) {
            if (page >= 1 && page <= this.total_pages) {                
                this.current_page = page;

                this.update_filters({
                    offset: ((this.current_page - 1) * this.data.filters.limit)
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
         * @param Object filters The filters to apply to the dataset.
         * @param Object refresh Whether or not to call the refresh handler. Defaults to true.
         */
        update_filters: function(filters, refresh) {
            $.extend(true, this.data.filters, filters || {});

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
            args = args || [];

            this.$wrapper.triggerHandler([name, this.name].join("."), ($.isArray(args) ? args : [args]));
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
            var self = this, data = {},
                request = request || {},
                filters = filters || {};

            this.trigger("loading", true);

            if (request.ajax) {
                filters = $.extend(true, {}, this.data.filters, filters);

                // merge request with additional internal arguments
                var request = $.extend(true, {}, request.ajax, {
                    data: filters,
                    success: function(data) {
                        // merge in static JSON content, if any
                        $.extend(true, data, request.json || {});

                        // fire post load handler
                        self.trigger("post_load", data);
                    },
                    error: function() {
                        self.error_handlers.ajax.apply(self, arguments);
                    }
                });

                $.ajax(request);
            }

            else {
                if (request.json) {
                    data = request.json;
                }

                this.trigger("post_load", data);
            }
        },

        /**
         * Applies properties to rows, columns and cells in the table.
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
         * @param jQuery $element The element to apply the properties to.
         * @param Object properties An object containing the properties.
         * 
         * @return jQuery The modified element
         */
        apply_properties: function($element, settings, properties) {
            var self = this,
                properties = properties || {},
                dataset = settings.dataset || {},
                key = (typeof settings.key != "undefined" ? settings.key : "");

            $element.each(function(i, element) {
                var $element = $(element),
                    data = (dataset[key] ? dataset[key] : dataset),
                    name = ($.isNumber(key) ? parseInt(key) + 1 : key),
                    $content = $(".tabulate-content", $element),
                    args = [$element, $content, data];

                // content defaults to element if not present
                if (!$content.length) $content = $element;

                // apply type class
                if (typeof settings.type == "string") {
                    $element.addClass([self.name, settings.type, name].join("-"));
                }

                // set up properties according to type
                switch(typeof properties) {
                    case "string": {
                        properties = { content: properties };
                        break;
                    }  
                    case "function": {
                        properties = { content: properties.apply(self, args) };
                        break;
                    }
                }

                // properties must be an object
                if (typeof properties == "object") {
                    $.each(properties, function(property, value) {
                        switch(property) {
                            case "attributes": {
                                $element.attr(value);
                                break;
                            }
                            case "content": {
                                if (typeof value == "function") {
                                    value = value.apply(self, args);
                                }

                                switch(typeof value) {
                                    case "object": {
                                        if (value instanceof $) {
                                            $content.append(value);
                                        }
                                        break;
                                    }
                                    default: {
                                        $content.append(value.replace(self.parse_key(), function(str, key) {
                                            return $.getObject(key, dataset) || "";
                                        }));
                                        break;
                                    }
                                }
                                break;
                            }
                            case "class_name": {
                                switch (typeof value) {
                                    case "function": {
                                        $element.addClass(value.apply(self, args));
                                        break;
                                    }
                                    default: {
                                        $element.addClass(value);
                                        break;
                                    }
                                }
                                break;
                            }
                            case "events": {
                                $.each(value, function(name, handler) {
                                    $element.bind(name, function(event) {
                                        handler.apply(self, [event].concat(args));
                                    });
                                });
                                break;
                            }
                            case "filter": {
                                value.apply(self, args);
                                break;
                            }
                            case "styles": {
                                $element.css(value);
                                break;
                            }
                        }
                    });
                }
            });
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

            // clear out the old data
            this.$table.children().empty();

            // build out new data
            $.each(this.table.columns, function(key, column) {
                self.columns = Math.max(self.columns, $.getLength(column));
                self.build_section(key, self.$table[key], $.getObject(self.keys[key], data));
            });

            // get count from data, or use number of body properties
            this.count = data[this.keys.count] || $.getLength(this.table.columns[this.keys.body]) ||  0;

            // total pages = count / limit (or 1, if count or limit = 0)
            this.total_pages = Math.ceil(this.count / this.data.filters.limit) || 1;

            // add cell hovers
            this.$table.find(".tabulate-cell").hover(
                function() { $(this).addClass("tabulate-hover"); },
                function() { $(this).removeClass("tabulate-hover") }
            );

            // add row classes
            this.$table.body.find(".tabulate-row:odd").addClass("tabulate-odd");
            this.$table.body.find(".tabulate-row:even").addClass("tabulate-even");
            this.$table.body.find(".tabulate-row:first").addClass("tabulate-first");
            this.$table.body.find(".tabulate-row:last").addClass("tabulate-last");

            // fire handlers
            this.trigger("loading", false);
            this.trigger("post_tabulate", data);
        },

        /**
         * Builds and appends a section of the table.
         * 
         * @param String name The name of the section
         * @param jQuery $element The element to append rows to
         * @param Object data The data to populate the section with
         * 
         * @return Number The number of columns in the section.
         */
        build_section: function(section, $element, data) {
            var self = this,
                data = data || {};

            if ($element && $element.length) {
                // build rows
                $.each(data, function(r, row) {
                    var empty = true,
                        r = r.toString(),
                        $row = self.$fragments.row.clone();

                    // build cells
                    $.each(row, function(c, column) {
                        var c = c.toString(),
                            $cell = self.$fragments.cell.clone(),
                            $content = self.$fragments.content.clone();

                        $cell.append($content);

                        self.apply_properties($cell, {
                            key: c,
                            type: "column",
                            dataset: data[r]
                        }, $.getObject(c, self.table.columns[section]) || {});

                        $row.append($cell);

                        // set render to true if we have cell content
                        if (empty && $content.html()) empty = false;
                    });

                    // at least one column needs content to append row
                    if (!empty) {
                        self.apply_properties($row, {
                            key: r,
                            type: "row",
                            dataset: data
                        }, $.getObject(r, self.table.rows[section]) || {});

                        $row.find(".tabulate-cell:first").addClass("tabulate-first");
                        $row.find(".tabulate-cell:last").addClass("tabulate-last");

                        $element.append($row);
                    }
                });
            }
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
             * Generally called when data needs to be re-loaded.
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
                this.gather_data(request || this.data.source, filters || {});
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
                    this.$elements.loading[(bool ? "addClass" : "removeClass")]("loading");
                } else {
                    this.$elements.loading.toggleClass("loading");
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
             * @see The jQuery <a href="http://api.jquery.com/category/events/event-object/">Event</a> Object
             * @param Object event The jQuery Event Object
             * @param Object data The data object that was passed into {@link jQuery.tabulate.tabulate}.
             * 
             * @event
             */
            post_tabulate: function(event, data) {
                this.$elements.count.text(this.count);
                this.$elements.total_pages.text(this.total_pages);
                this.$elements.current_page.val(this.current_page);
            }
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
                alert(xhr.status + ": " + (xhr.statusText || "Unknown error."));
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
})(jQuery);