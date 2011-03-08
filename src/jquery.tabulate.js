/**
 * @fileOverview The jQuery.tabulate plugin.
 *
 * @author Kyle Florence <kyle[dot]florence[at]gmail[dot]com>
 * @version 2.4.20110303
 */
;(function($, window, undefined) {
  // For better minification
  var refresh = "refresh", loading = "loading", ready = "ready",
    hover = "hover", odd = "odd", even = "even", obj = "object",
    str = "string", bool = "boolean";

  /**
   * The tabulate class.
   */
  $.tabulate = {
    cache: {},
    eventHandlers: {},
    errorHandlers: {},
    currentCount: 0,
    currentPage: 1,
    totalCount: 0,
    totalPages: 1,
    columns: 0,
    filters: {
      limit: 0,
      offset: 0
    },
    options: {
      debug: false,
      namespace: "tabulate",
      resultsPerPage: [5, 10, 25],
      keyRegex: "/\{([^{}]+)\}/g",
      insert: "prepend",
      data: {
        source: {},
        filters: {}
      },
      table: {
        head: {
          template: "<thead></thead>"
        },
        body: {
          template: "<tbody></tbody>"
        },
        foot: {
          template: "<tfoot></tfoot>"
        }
      },
      keys: {
        data: "body",
        count: "count"
      },
      elements: {
        status: ".status",
        previous: ".previous",
        next: ".next",
        count: ".count",
        totalPages: ".total-pages",
        currentPage: ".current-page",
        resultsPerPage: ".results-per-page"
      },
      templates: {
        row: "<tr></tr>",
        cell: "<td></td>",
        cellContent: "<div></div>",
        table: "<table></table>"
      },
      eventHandlers: {},
      errorHandlers: {}
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
    initialize: function(element, options) {
      $.extend(true, this.options, options || {});

      // Only if this element doesn't already contain an instance of tabulate
      if ($.data(element, this.options.namespace)) {
        return;
      }

      var self = this;

      // Attach instance to element
      this.$element = $(element).data(this.options.namespace, this);

      // set limit to first item in results per page array, if not set
      this.filters.limit = this.filters.limit || this.options.resultsPerPage[0];

      // generate parsekey regex
      this.keyRegex = new RegExp(this.options.keyRegex);

      // Set up elements
      this.elements = {};
      $.each(this.options.elements, function(name, selector) {
        self.elements["$" + name] = $(selector)
          .addClass([self.options.namespace, name].join("-"));
      });

      // Set up templates
      this.templates = {};
      $.each(this.options.templates, function(name, content) {
        self.templates["$" + name] = $(content)
          .addClass([self.options.namespace, name].join("-"));
      });

      if ($.isFunction($.fn[this.options.insert])) {
        this.$element[this.options.insert](this.templates.$table);
      } else {
        throw new Error('Invalid insert method: "' + this.options.insert + '"');
      }

      if (this.elements.$previous.length) {
        this.elements.$previous.click(function() {
          self.previous(this);
          return false;
        });
      }

      if (this.elements.$next.length) {
        this.elements.$next.click(function() {
          self.next(this);
          return false;
        });
      }

      if (this.elements.$currentPage.length) {
        this.elements.$currentPage.keyup(function(e) {
          var page = parseInt($(this).val());

          if (!isNaN(page) && e.which == 13) {
            self.select(page);
          }
        });
      }

      if (this.elements.$resultsPerPage.length) {
        var $option = $('<option />');

        $.each(this.options.resultsPerPage, function(i, value) {
          self.elements.$resultsPerPage.append(
            $option.clone().val(value).text(value)
          );
        });

        this.elements.$resultsPerPage.change(function() {
          var limit = parseInt($(this).val());

          if (!isNaN(limit)) {
            self.filters.limit = limit;
            self.trigger("reset");
          }
        });
      }

      $.each(this.eventHandlers, function(eventType, handler) {
        var eventName = [eventType, self.options.namespace].join(".");

        self.$element.bind(eventName, function() {
          handler.apply(self, arguments);
        });
      });

      this.trigger("initialized");
    },

    /**
     * Select the previous page.
     *
     * @param {Element} element
     *    The DOM element that was clicked.
     */
    previous: function(element) {
      if (this.currentPage > 1) {
        this.select(this.currentPage - 1);
      }
    },

    /**
     * Selects the next page.
     *
     * @param {Element} element
     *    The DOM element that was clicked.
     */
    next: function(element) {
      if (this.currentPage < this.totalPages) {
        this.select(this.currentPage + 1);
      }
    },

    /**
     * Select an arbitrary page.
     *
     * @param {number} page
     *    An integer value specifying the page to go to.
     */
    select: function(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.filters.offset = ((this.currentPage - 1) * this.filters.limit);
        this.trigger(refresh);
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
    updateFilters: function(filters, overwrite, refresh) {
      filters = filters || {};

      if (overwrite !== false) {
        this.options.data.filters = filters;
      } else {
        $.extend(true, this.options.data.filters, filters || {});
      }

      if (refresh !== false) {
        this.trigger(refresh);
      }
    },

    /**
     * Convenience function for displaying error information.
     */
    error: function() {
      if (this.debug && console && console.log) {
        console.log("Error [" + this.options.namespace + "]: ", arguments);
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
    trigger: function(eventType, args) {
      this.$element.triggerHandler(
        [eventType, this.options.namespace].join("."),
        args ? ($.isArray(args) ? args : [args]) : []
      );
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
    gatherData: function(request, filters) {
      request = request || {};
      filters = filters || {};

      // gather JSON data via AJAX request
      if (request.ajax) {
        var self = this;

        // merge request with additional internal arguments
        $.ajax($.extend({}, request.ajax, {
          data: $.extend(true, {}, this.filters, this.options.data.filters, filters),
          // TODO: implement caching!!
          success: function(data) {
            if (request.ajax.success) {
              request.ajax.success.apply(self, arguments);
            }

            self.trigger(ready, data);
          },
          error: function() {
            if (request.ajax.error) {
              request.ajax.error.apply(self, arguments);
            } else {
              self.errorHandlers.ajax.apply(self, arguments);
            }
          },
          complete: function() {
            if (request.ajax.complete) {
              request.ajax.complete.apply(self, arguments);
            }

            self.elements.$status.toggleClass(loading);
          }
        }));

        self.elements.$status.toggleClass(loading);
      } else if (request.json) {
        this.trigger(ready, request.json);
      }
    },

    /**
     * Given data, builds a tabular view of that data.
     *
     * @param {Object} data
     *    The object containing the data to tabulate.
     */
    tabulate: function(data) {
      data = data || {};

      this.currentCount = $.getLength(data[this.options.keys.data]) || 0;
      this.totalCount = parseInt(data[this.options.keys.count]) || this.currentCount;
      this.totalPages = Math.ceil(this.totalCount / this.filters.limit) || 1;
      this.currentPage = Math.floor(this.filters.offset / this.filters.limit) + 1;

      // clear out the old data
      this.templates.$table.children().empty();

      // if total count is zero, we have nothing to tabulate
      if (this.totalCount !== 0) {
        var $section, self = this;

        $.each(this.options.table, function(section, options) {
          $section = self.buildSection(section, options,
            $.getObject(options.key || section, data) || []);
        });
      }

      this.trigger("done", data);
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
    buildSection: function(name, options, data) {
      if (!this.options.table[name].template) {
        return;
      }

      var self = this,
        $section = $(this.options.table[name].template).clone(),
        data = data.slice(
          this.filters.offset, this.filters.offset + this.filters.limit
        );

      // append section to table
      this.templates.$table.append($section.addClass(
        [self.options.namespace, name].join("-")
      ));

      // build rows
      $.each(data, function(r, row) {
        var r = r.toString(), $row = self.templates.$row.clone();

        // build cells
        $.each(row, function(c, cell) {
          var c = c.toString(),
            $cell = self.templates.$cell.clone();

          self.applyProperties($cell, {
            key: c,
            type: "column",
            dataset: data[r]
          }, $.getObject(c, options.cells));

          // append to row, add hover classes (for IE)
          $row.append($cell.bind("mouseenter mouseleave", function() {
            $(this).toggleClass([self.options.namespace, hover].join("-"));
          }));
        });

        self.applyProperties($row, {
          key: r,
          type: "row",
          dataset: data
        }, $.getObject(r, options.rows));

        $row.children(":odd").addClass("tabulate-even");
        $row.children(":even").addClass("tabulate-odd");
        $row.children(":first").addClass("tabulate-first");
        $row.children(":last").addClass("tabulate-last");

        $section.append($row);
      });

      $section.children(":odd").addClass("tabulate-even");
      $section.children(":even").addClass("tabulate-odd");
      $section.children(":first").addClass("tabulate-first");
      $section.children(":last").addClass("tabulate-last");

      // update column count
      this.columns = Math.max(this.columns, data.length);

      return $section;
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
    applyProperties: function($element, settings, properties) {
      var self = this, dataset = settings.dataset || {},
        key = (typeof settings.key != "undefined" ? settings.key : "");

      $element.each(function(i, element) {
        var $element = $(element),
          data = (dataset[key] ? dataset[key] : dataset),
          name = ($.isNumber(key) ? parseInt(key) + 1 : key),
          args = [$element, data],
          props = (properties
            ? (typeof properties == "object"
              ? properties : { content: properties }
            ) : (typeof data == "object" ? {} : { content: data })
          );

        $element.addClass([self.options.namespace, settings.type, name].join("-"));

        $.each(props, function(property, value) {
          switch(property) {
            // jQuery Object, HTML, String or Function (returning one of those types) supported
            case "content": {
              if (value.hasOwnProperty && value instanceof jQuery) {
                $element.append(value);
              } else {
                $element.append((typeof value == "function" ? value.apply(self, args) : value)
                  .replace(self.keyRegex, function(str, key) {
                    return $.getObject(key, dataset) || "";
                  })
                );
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
     * Object.toString override
     *
     * @return String "[object instance.name]"
     */
    toString: function() {
      return "[" + obj + " " + this.name + "]";
    }
  };

  $.extend($.tabulate.eventHandlers, {
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
    refresh: function(e, request, filters) {
      if ((this.currentCount === 0)
        || (this.filters.offset + this.filters.limit > this.currentCount)
        && (this.currentCount < this.totalCount)) {
        this.gatherData(request || this.options.data.source, filters);
      } else {
        this.tabulate(this.cache);
      }
    },

    /**
     * Called after initialization.
     *
     * @param {Object} event
     *    The jQuery Event Object
     */
    initialized: function(e) {
      this.gatherData(this.options.data.source);
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
    ready: function(e, data) {
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
    done: function(e, data) {
      this.elements.$count.text(this.totalCount);
      this.elements.$totalPages.text(this.totalPages);
      this.elements.$currentPage.val(this.currentPage);
    },

    /**
     * Called if tabulate detects an empty data set.
     */
    empty: function(e) {
      this.templates.$table.append(this.templates.$row.clone().append(
        this.templates.$cell.clone().text("No results found.")
      ));
    },

    /**
     * Resets the table to its default state.
     *
     * @param {Object} event
     *    The jQuery Event Object
     */
    reset: function(e) {
      this.cache = {};
      this.totalCount = this.currentCount = 0;
      this.select(1);
    }
  });

  $.extend($.tabulate.errorHandlers, {
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
  });

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
      if ($.isArray(a) || typeof a == str) {
        return a.length;
      } else if (typeof a == obj) {
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
      if (typeof parts == str) {
        parts = parts.split(".");
      }

      if (typeof create != bool) {
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
      if ($.isArray(o) || typeof o == str) {
        return (o.length ? false : true);
      } else if (typeof o == obj) {
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
      $.extend({}, $.tabulate).initialize(this, options);
    });
  };
})(jQuery, window);
