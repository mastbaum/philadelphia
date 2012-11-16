/**
* jquery.couchtools.js
*
* dynamic-ness and collaborative editing with jquery and couchdb
*
* A.Mastbaum <amastbaum@gmail.com>, March 2012
*
*/

(function($) {

  var methods = {
    /** update on change
    *
    *  Usage: $(element).couchtools('update', options)
    *
    *  Options:
    *    - editor_id (string, optional)
    *        a unique identifier for this session, defaults to a
    *        new uuid.
    *    - db_name (string, required)
    *        the name of the couch database
    *    - filter_name (string, required)
    *        the name of the changes feed filter to apply
    *    - doc_id (string, required)
    *        the id of the document to watch for updates
    *    - actions (list of functions, required)
    *        a list of functions which take a changed document
    *        and the jQuery object and do stuff to the object.
    *
    *        example:
    *
    *          actions: [
    *            function(doc, elem) {
    *              if (doc.css && 'color' in doc.css) {
    *                $(elem).css('color', doc.css.color);
    *              }
    *            }
    *          ]
    */
    'update': function(options) {
      var settings = $.extend({}, options);

      var elem = this;
      var data = elem.data('couchtools.update');

      if (!data) {
        $.couch.urlPrefix = settings.base_url || '';
        var db = $.couch.db(settings.db_name);
        elem.data('couchtools.update', {
          editor_id: settings.editor_id ? settings.editor_id : $.couch.newUUID(),
          actions: settings.actions,
          db: db,
          changes: db.changes(null, {
            include_docs: true,
            filter: settings.filter_name,
            id: settings.doc_id
          })
        });
        //console.log('id = ' + settings.doc_id);
        data = elem.data('couchtools.update');
      }

      data.changes.onChange(function(d) {
        for (i in d.results) {
          var doc = d.results[i].doc;
          for (k in data.actions) {
            // don't bother with our own changes
            if (!doc.editor_id || doc.editor_id != data.editor_id) {
              data.actions[k](doc, elem);
            }
          }
        }
      });

      return elem;
    },

    /** load elements from db
    *
    *  Usage: $(element).couchtools('load', options)
    *
    *  Options:
    *    - editor_id (string, optional)
    *        a unique identifier for this session, defaults to a
    *        new uuid.
    *    - db_name (string, required)
    *        the name of the couch database
    *    - doc_id (string, required)
    *        the id of the document to watch for updates
    *    - actions (list of functions, required)
    *        a list of functions which take a document and the
    *        jQuery object and do stuff to the object. example:
    *
    *          actions: [
    *            function(doc, elem) {
    *              if ('foo' in doc) {
    *                $(elem).val(doc.foo);
    *              }
    *            }
    *          ]
    */
    'load': function(options) {
      var settings = $.extend({}, options);

      var elem = this;
      var data = elem.data('couchtools.load');

      if (!data) {
        var db = $.couch.db(settings.db_name);
        elem.data('couchtools.load', {
          db: db,
          doc_id: settings.doc_id,
          actions: settings.actions
        });
        data = elem.data('couchtools.load');
      }

      data.db.openDoc(data.doc_id, {
        success: function(doc) {
          for (i in data.actions) {
            data.actions[i](doc, elem);
          }
          if (settings.complete) {
            settings.complete();
          }
        },
        error: function(e) {
          //console.log('couchtools.load: error loading ' + doc_id + ': ' + e);
        }
      });

      return elem;
    },

    'save': function(options) {
      return elem;
    }

  } // end of methods

  $.fn.couchtools = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    else {
      $.error('method ' + method + ' does not exist on jQuery.couchtools.'); 
    }
  };

})(jQuery);

