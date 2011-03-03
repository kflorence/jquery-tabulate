/**
 * @fileOverview The jQuery.tabulate plugin.
 *
 * @author Kyle Florence <kyle[dot]florence[at]gmail[dot]com>
 * @version 2.4.20110303
 */
;(function($, window, undefined) {
  /**
   * The tabulate class.
   */
  $.tabulate = {
    cache: {},
    current_count: 0,
    current_page: 1,
    total_count: 0,
    total_pages: 1,
    columns: 0,
    filters: {
      limit: 0,
      offset: 0
    },

    options: {
      name: "tabulate",
      debug: false,
      results_per_page: [5, 10, 25],
      parse_key: function() {
        return new RegExp(/\{([^{}]+)\}/g);
      },
      paths: {
        tabulate: window.location.pathname.replace(/\/$/, ''),
        theme: "themes/default",
        images: {
          previous: "images/prev.png",
          next: "images/next.png"
        }
      },

      data: {
        source: {},
        filters: {}
      },

      /**
       * Contains the sections of the table and their settings.  By default,
       * the sections "head", "body" and "foot" have been defined for you.
       * You may use these sections for your table, overwrite them, or
       * define your own.
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
       */
      keys: {
        data: "body",
        count: "count"
      },

      /**
       * Contains the jQuery selectors for key elements.
       */
      elements: {
        $loading: ".tabulate-loading",
        $previous: ".tabulate-prev",
        $next: ".tabulate-next",
        $count: ".tabulate-count",
        $total_pages: ".tabulate-total-pages",
        $current_page: ".tabulate-current-page",
        $results_per_page: ".tabulate-results-per-page"
      },

      /**
       * Contains jQuery objects generated from HTML fragments.
       */
      fragments: {
        $link: $('<a />'),
        $image: $('<img />'),
        $option: $('<option />'),
        $row: $('<tr class="tabulate-row"></tr>'),
        $cell: $('<td class="tabulate-cell"></td>'),
        $content: $('<div class="tabulate-content"></div>'),
        $container: $('<table class="tabulate-container"></table>'),
        $navigation: $(
          [
            '<div class="tabulate-navigation clearfix">',
            '  <div class="tabulate-partition tabulate-partition-first tabulate-pagination">',
            '    <img class="tabulate-prev" />',
            '    page <input class="tabulate-current-page" type="text" />',
            '    of <span class="tabulate-total-pages"></span>',
            '    <img class="tabulate-next" />',
            '  </div>',
            '  <div class="tabulate-partition tabulate-partition-no-input">',
            '    <span class="tabulate-count">0</span> total results',
            '  </div>',
            '  <div class="tabulate-partition tabulate-partition-no-input">',
            '    <div class="tabulate-loading"><span>Loading...</span></div>',
            '  </div>',
            '  <div class="tabulate-partition tabulate-partition-last">',
            '    <select class="tabulate-results-per-page"></select> results per page',
            '  </div>',
            '</div>',
          ].join('')
        )
      },
      event_handlers: {},
      error_handlers: {}
    },

    /**
     * Initializes the tabulate class.
     *
     * @param {jQuery} $wrapper
     *    The element passed in from the jQuery function.
     *
     * @param {Object} options 
     *    Options to overwrite the default ones with.
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
     * Select the previous page.
     *
     * @param {Element} element
     *    The DOM element that was clicked.
     */
    previous: function(element) {
      if (this.current_page > 1) {
        this.current_page--;
        this.filters.offset = ((this.current_page - 1) * this.filters.limit);
        this.trigger("refresh");
      }
    },

    /**
     * Selects the next page.
     *
     * @param {Element} element
     *    The DOM element that was clicked.
     */
    next: function(element) {
      if (this.current_page < this.total_pages) {
        this.current_page++;
        this.filters.offset = ((this.current_page - 1) * this.filters.limit);
        this.trigger("refresh");
      }
    },

    /**
     * Select an arbitrary page.
     *
     * @param {number} page
     *    An integer value specifying the page to go to.
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
     * @param {Object} filters
     *    The filters to apply to the data set.
     *
     * @param {Boolean} overwrite
     *    Whether or not to overwrite the current filters with the new filters.
     *    Defaults to true.  If false, the two filter objects would be merged.
     *
     * @param {Object} refresh
     *    Whether or not to call the refresh handler. Defaults to true.
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
     * @param {String} name
     *    The name of the event handler.
     *
     * @param {Array} args
     *    The Array of arguments to pass to the handler function.
     */
    trigger: function(name, args) {
      this.$wrapper.triggerHandler([name, this.name].join("."),
        args ? ($.isArray(args) ? args : [args]) : []);
    },

    /**
     * Gathers the data needed for tabulation.
     *
     * @param {Object} request
     *    The request object.
     *
     * @param {Object} filters
     *    Filters that will apply to this request only.
     */
    gather_data: function(request, filters) {
      var self = this, request = request || {}, filters = filters || {};

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
     * @param {Object} data
     *    The object containing the data to tabulate.
     */
    tabulate: function(data) {
      var self = this, data = data || {};

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
          self.build_section(section, options,
            $.getObject(options.key || section, data) || []);
        });
      }

      // fire post_tabulate handler
      this.trigger("post_tabulate", data);
    },

    /**
     * Builds and appends a section of the table.
     *
     * @param {String} section
     *    The name of the section
     *
     * @param {Object} options
     *    Contains the section key, $section fragment and any additional
     *    properties to bestow upon the section.
     *
     * @param {Object} data
     *    The data given to tabulate
     */
    build_section: function(name, options, data) {
      // if no containing element is given, there is nothing to do
      if (!options.container || !options.container.length) {
        return;
      }

      var self = this, $section = options.container.clone(),
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
     * Applies properties to cells or rows in the table.
     *
     * @param {jQuery} $element
     *    The element to apply the properties to.
     *
     * @param {Object} settings
     *    An object containing settings for the element.
     *
     * @return {jQuery}
     *    The modified element.
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

    event_handlers: {
      /**
       * Changes or updates the scope of the data shown.
       *
       * @param {Object} event
       *    The jQuery.Event object
       *
       * @param {Object} request
       *    The data request object
       *
       * @param {Object} filters
       *    Filters to apply to the request
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
       * @param {Object} event
       *    The jQuery.Event Object
       *
       * @param {Boolean} [bool]
       *    Whether or not to show the loading element. By default, the element
       *    will be toggled.
       */
      loading: function(event, bool) {
        if (typeof bool == "boolean") {
          this.elements.$loading[(bool ? "addClass" : "removeClass")]("loading");
        } else {
          this.elements.$loading.toggleClass("loading");
        }
      },

      /**
       * Called after initialization.
       *
       * @param {Object} event
       *    The jQuery Event Object
       */
      post_init: function(event) {
        this.gather_data(this.data.source);
      },

      /**
       * Called after loading data.
       *
       * @param {Object} event
       *    The jQuery Event Object
       *
       * @param {Object} data
       *    The data that was loaded.
       */
      post_load: function(event, data) {
        this.tabulate(data);
      },

      /**
       * Called after tabulate finishes processing.
       *
       * @param {Object} event
       *    The jQuery Event Object
       *
       * @param {Object} data
       *    The data object that was passed into tabulate.
       */
      post_tabulate: function(event, data) {
        this.elements.$count.text(this.total_count);
        this.elements.$total_pages.text(this.total_pages);
        this.elements.$current_page.val(this.current_page);
      },

      /**
       * Called if there was no data to tabulate upon.
       *
       * @param {Object} event
       *    The jQuery Event object.
       */
      no_results: function(event) {
        this.$navigation.before(this.fragments.$content.clone()
          .addClass("tabulate-no-results").text("No results found")
        );
      },

      /**
       * Resets tabulate back to it's default state.
       *
       * @param {Object} event
       *    The jQuery Event Object
       */
      reset: function(event) {
        this.cache = {};
        this.total_count = this.current_count = 0;
        this.go_to(1);
      }
    },

    error_handlers: {
      /**
       * Handles AJAX request errors.
       *
       * @param {Object} xhr
       *    The XMLHttpRequest Object
       *
       * @param {String} status
       *    A String describing the type of error that occurred
       *
       * @param {Exception} error
       *    An exception object, if one occurred
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
     * jQuery getObject - v1.1 - 12/24/2009
     * http://benalman.com/projects/jquery-getobject-plugin/
     *
     * Copyright (c) 2009 "Cowboy" Ben Alman
     * Dual licensed under the MIT and GPL licenses.
     * http://benalman.com/about/license/
     *
     * Inspired by Dojo, which is Copyright (c) 2005-2009, The Dojo Foundation.
     */
    getObject: function(parts, create, obj) {
      if (typeof parts === 'string') {
        parts = parts.split('.');
      }

      if (typeof create !== 'boolean') {
        obj = create;
        create = undefined;
      }

      obj = obj || window;

      var p;

      while (obj && parts.length) {
        p = parts.shift();
        if (obj[p] === undefined && create) {
          obj[p] = {};
        }
        obj = obj[p];
      }

      return obj;
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

  /**
   * The jQuery.tabulate plugin.
   *
   * @param {object} options
   *    An object containing default option overrides.
   *
   * @return {jQuery}
   *    The jQuery object that was passed to this function.
   */
  $.fn.tabulate = function(options) {
    return this.each(function() {
      var $this = $(this);

      // don't re-create if this element has already been tabulated
      if (!$this.data("tabulate")) {
        var tabulate = $.extend(true, {}, $.tabulate);

        // store class instance in $this
        $this.data("tabulate", tabulate);

        // initialize, pass in options
        tabulate.init($this, options);
      }
    });
  };
})(jQuery, window);
