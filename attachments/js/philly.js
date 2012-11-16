/*
* Philadelphia 0.9 - The shift report system from the future
*
* Andy Mastbaum (amastbaum@gmail.com), 2012
*
* source: http://github.com/mastbaum/philadelphia
* bugs: http://github.com/mastbaum/philadelphia/issues
*/

self.console = self.console || { log: function() {} };

var phila = (function() {
  var p = {};

  /* shared 'global' settings */
  p.settings = {
    url_prefix: '',
    db_name: 'phila'
  };
  $.couch.urlPrefix = p.settings.url_prefix;
  p.settings.db = $.couch.db(p.settings.db_name);

  /* editor methods and state data */
  p.editor = (function() {
    var editor = {}

    editor.report_id = $.couch.newUUID();
    editor.editor_id = $.couch.newUUID();
    editor.submitted = false;

    /* save all docs currently on the page (the report and all blocks) */
    editor.save = function() {
      p.editor.save_report('#report');
      $(".block").each(function(i) {
        p.editor.save_block(this);
      });
    };

    /* jsonize the report metadata in elem and save it to the db */
    editor.save_report = function(elem) {
      if (p.editor.submitted) {
        return;
      }
      $('input[name="report_id"]').val(editor.report_id);
      var doc = $(elem).find("form.report-meta").serializeObject();
      p.tools.create_or_update_doc(doc, ['comments']);
    }

    /* jsonize the block data in elem and save it to the db */
    editor.save_block = function(elem) {
      //console.log('save block');
      $(elem).find('input[name="report_id"]').val(p.editor.report_id);
      var doc = $(elem).find("form.block-meta").serializeObject();
      doc.fields = [];
      $(elem).find("form.block-field").each(function(i) {
        doc.fields.push($(this).serializeObject());
      });
      p.tools.create_or_update_doc(doc);
    };

    /* set the submitted flag, save the report, return to index page */
    editor.submit = function() {
      p.settings.db.openDoc(p.editor.report_id, {
        success: function(data) {
          data.submitted = true;
          p.settings.db.saveDoc(data, {
            success: function(data) {
              p.editor.submitted = true;
              $(".block").each(function(i) {
                p.editor.save_block(this);
              });
              setTimeout(function() {
                window.location.href = 'index.html';
              }, 5000);
            },
            error: function() {
              alert('Unable to update document ' + report_id);
            }
          });
          return false;
        }
      });
    };

    /* load templates from the db to populate the template bin. if
     * load_defaults, also put default blocks in the target */
    editor.load_templates = function(load_defaults) {
      p.settings.db.view('phila/templates', {
        success: function(data) {
          for (i in data.rows) {
            var doc = data.rows[i].value;
            var html = '<div class="well template" style="margin:5px;padding:2px">';
            html += '<span class="template-name" style="font-size:large;font-weight:bold;">' + doc.name + '</span>';
            html += '<input type="hidden" name="id" value="' + doc._id + '">';
            html += '</div>';

            $(html).appendTo('#source').draggable({
              connectToSortable: '#target',
              revert: 'invalid',
              helper: 'clone',
              opacity: 0.7
            });

            // start the user out with default templates
            if (doc.default == true && load_defaults) {
              html = '<div class="block" style="margin:5px;padding:2px"></div>';
              var block = $(html);
              
              block.couchtools('load', {
                db_name: p.settings.db_name,
                doc_id: doc._id,
                actions: [p.renderers.block.edit],
                complete: function() {
                  //block.couchtools('update', {
                  //  db_name: p.settings.db_name,
                  //  editor_id: phila.editor.editor_id,
                  //  doc_id: block.find('input[name="_id"]').val(),
                  //  filter_name: 'phila/id',
                  //  actions: [p.renderers.block.edit]
                  //});
                  p.editor.save_block(block);
                }
              });


              $("#target").append(block);
            }
          }
          //if (load_defaults) {
          //  $("#target").append('<div id="drag_hint" style="padding:1em;">Drag templates here...</div>');
          //}
        }
      });
    };

    /* fill in report metadata from doc */
    editor.init_report = function(doc) {
      var html = '';
      html += '<form class="report-meta">';
      html += '<input type="hidden" name="_id" value="' + doc._id + '"/>';
      html += '<input type="hidden" name="type" value="' + doc.type + '"/>';
      html += '<input type="hidden" name="created" value="' + doc.created + '"/>';
      html += '</form>';

      var link_html = '<a style="font-size:xx-small;color:#00a;text-decoration:underline" href="view.html?id=' + doc._id + '">' + doc._id + '</a>';
      $("#report_id").html(link_html);

      $('#report').append(html);
    };

    return editor;
  }()); // p.editor

  /* plotting utilities */
  p.plot = (function() {
    var plot = {};

    // make a histogram out of a data series
    plot.histogram = function(data, nbins) {
      var min = Math.min.apply(Math, data);
      var max = Math.max.apply(Math, data);
      var width = (max - min + 1) / nbins;

      var bins = [];
      for (var i = 0; i < nbins; i++) {
        var leftEdge = min + i * width;
        bins.push({
          leftEdge: leftEdge,
          count: 0
        });
      }

      for (i = 0; i < data.length; i++) {
        for (var j = 0; j < nbins; j++) {
          if (data[i] >= bins[j].leftEdge && (bins[j+1] ? data[i] < bins[j+1].leftEdge : data[i] <= max)) {
            bins[j].count++;
          }
        }
      }

      var hist = [];
      for (i = 0; i < bins.length; i++) {
        hist.push([bins[i].leftEdge, bins[i].count]);
      }
      return hist;
    };

    return plot;
  }()); //p.plot

  /* tools library */
  p.tools = (function() {
    var tools = {};

    /* read a query string parameter */
    tools.get_parameter_by_name = function(name) {
      name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS = "[\\?&]" + name + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(window.location.href);
      if(results == null) return "";
      else return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    /* pretty-print a date */
    tools.date_string = function(d) {
      if (!d) {
        return '';
      }

      function pad(n){
        return n < 10 ? '0' + n : n
      }

      return d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+' '
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds());
    };

    /* set all input fields matching to autocomplete with keys from db */
    tools.load_autocomplete_keys = function(selector) {
      // fixme use jquery.couch
      $.ajax("/" + p.settings.db_name + "/_design/phila/_view/keylist", {
        dataType: 'json',
        data: 'group=true',
        success: function(data) {
          var keys = [];
          for (var i in data.rows)  {
            keys.push(data.rows[i].key);
          }
          $(selector).typeahead({source: keys});
        }
      });
    };

    /* save a document to the db. if it exists, fields are overwritten except
    * those listed in preserve_fields. */
    tools.create_or_update_doc = function(doc, preserve_fields) {
      p.settings.db.openDoc(doc._id, {
        success: function(data) {
          if (!doc._rev) {
            doc._rev = data._rev;
          }
          doc._attachments = data._attachments;
          if (preserve_fields) {
            for (i in preserve_fields) {
              doc[preserve_fields[i]] = data[preserve_fields[i]];
            }
          }
          p.settings.db.saveDoc(doc, {
            success: function() {
              //console.log('updated ' + doc._id);
            },
            error: function() {
              console.log('error updating ' + doc._id);
              console.log('  _rev: ' + data._rev)
            }});
        },
        error: function(e) {
          p.settings.db.saveDoc(doc, {
            success: function() {
              //console.log('saved new');
            },
            error: function() {
              console.log('error saving new!');
            }});
        }
      });
    };

    /* remove a document from the db by id. does not verify revision! */
    tools.remove_doc = function(id, selector) {
      p.settings.db.openDoc(id, {
        success: function(data) {
          p.settings.db.removeDoc(data, {
            success: function() {
              //console.log('deleted ' + id);
              $(selector).remove();
            },
            error: function() {
              console.log('error deleting ' + id);
            }
          });
        },
        error: function() {
          console.log('could not open to delete: ' + id);
        }
      });
    };

    /* delete a document attachment. remove elem from dom if provided */
    tools.remove_attachment = function(doc_id, filename, elem) {
      db.openDoc(doc_id, {
        success: function(data) {
          $.ajax('/' + p.settings.db_name + '/' + doc_id + '/' + filename + '?rev=' + data._rev, {
            type: 'DELETE',
            success: function() {
              //console.log('deleted attachment ' + filename + ' on ' + doc_id);
              $(elem).remove();
            },
            error: function() {
              alert('error deleting attachment ' + filename + ' on ' + doc_id);
            }
          });
        }
      });
    };

    return tools;
  }()); // p.tools

  /* renderers turn doc to dom */
  p.renderers = (function() {
    var renderers = {}

    /* render a block (or template) */
    renderers.block = (function() {
      var block = {};

      /* render a block or template as a table for display */
      block.view = function(doc, elem) {
        var meta_fields = {'subtype':'','report_id':'','_rev':'','type':'','_id':'','created':'','_attachments':'', 'subtype_name': ''};
        var html = '<span class="template-name" style="font-size:large;font-weight:bold">' + doc.name + '</span>';
        html += '<span class="docid label" style="font-size:xx-small;float:right;">DOCUMENT ID: ' + doc._id + '</span>';
        html += '<div class="timestamp" style="font-size:x-small">Created: ' + (new Date(doc.created)).toLocaleString() + '</div>';
        html += '<table class="fields table table-striped">';
        for (field in doc.fields) {
          if (doc.fields[field].name in meta_fields) {
            continue;
          }
          html += '<tr>';
          html += '<th style="white-space:nowrap;padding:3px;vertical-align:top">' + doc.fields[field].name + '</th>';
          if (doc.fields[field].type == "text") {
            html += '<td style="width:100%;padding:3px;">' + doc.fields[field].value.replace(/\n/gi,'<br/>') + '</td>';
          }
          else if (doc.fields[field].type == "checkbox") {
            html += '<td style="width:100%;padding:3px;"><input type="checkbox" disabled ' + (doc.fields[field].value == 'true' ? 'checked' : '') + '/></td>';
          }
          else if (doc.fields[field].type == "textarea") {
            html += '<td style="width:100%;padding:3px;"><pre style="word-break:normal">' + doc.fields[field].value.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;") + '</pre></td>';
          }
          html += '</tr>';
        }

        for (file in doc._attachments) {
          html += '<tr>';
          html += '<th style="white-space:nowrap;padding:3px;">Attachment: </th>';
          html += '<td style="width:100%;padding:3px;"><a target="_new" href="/' + p.settings.db_name + '/' + doc._id + '/' + file + '">' + file + '</a></td>';
          html += '</tr>';
        }

        html += '</table>';

        $(elem).html(html);
      };

      /* render a block or template a table with input fields for editing. if
      * doc is a template, it is converted into a block. */
      block.edit = function(doc, elem) {
        if (doc.type == 'template') {
          doc.type = 'block';
          doc._id = $.couch.newUUID(),
          delete doc._rev;
          doc.created = new Date();
        }

        var html = '';
        html += '<div class="well" style="background:white;color:black">';
        html += '<a href="#" class="block-delete btn btn-danger" style="float:right;margin-left:5px">';
        html += '<i class="icon-trash icon-white"></i></a>';
        html += '<span style="font-size:large;font-weight:bold;">' + doc.name + '</span>';
        html += '<div class="timestamp" style="font-size:x-small">' + doc.created + '</div>';
        html += '<div class="id" style="font-size:x-small">Document ID: ' + doc._id + '</div>';

        // hidden fields with report metadata
        html += '<form class="block-meta">';
        html += '<input type="hidden" name="_id" value="' + doc._id + '"/>';
        html += '<input type="hidden" name="report_id" value=""/>';
        html += '<input type="hidden" name="editor_id" value="' + p.editor.editor_id + '"/>';
        html += '<input type="hidden" name="type" value="' + doc.type + '"/>';
        html += '<input type="hidden" name="name" value="' + doc.name + '"/>';
        html += '<input type="hidden" name="created" value="' + doc.created + '"/>';
        html += '</form>';

        html += '<table class="block-table table table-striped table-condensed">';

        // form fields
        for (idx in doc.fields) {
          var attrib = doc.fields[idx].attrib || '';

          if (doc.fields[idx].required && doc.fields[idx].required != 'undefined') {
            attrib += ' required="required" ';
          }

          html += '<tr>';

          if (!doc.fields[idx].required || doc.fields[idx].required == 'undefined') {
            html += '<td style="vertical-align:top"><a href="#" class="field-delete"><i class="icon-remove-sign"></i></a></td>';
          }
          else {
            html += '<td></td>';
          }

          html += '<th style="white-space:nowrap;vertical-align:top">' + doc.fields[idx].name + '</th>';
          html += '<td style="width:100%">'

          // hidden fields with field metadata
          html += '<form class="block-field">';
          html += '<input type="hidden" name="name" value="' + doc.fields[idx].name + '"/>';
          html += '<input type="hidden" name="attrib" value="' + doc.fields[idx].attrib + '"/>';
          html += '<input type="hidden" name="required" value="' + doc.fields[idx].required + '"/>';
          html += '<input type="hidden" name="type" value="' + doc.fields[idx].type + '"/>';

          if (doc.fields[idx].type == "text") {
            html += '<input class="field" type="text" name="value" value="' + (doc.fields[idx].value ? doc.fields[idx].value : '') + '" ' + attrib + '/>';
          }
          else if (doc.fields[idx].type == "textarea") {
            html += '<textarea name="value" ' + attrib + '>' + (doc.fields[idx].value ? doc.fields[idx].value : '') + '</textarea>';
          }
          else if (doc.fields[idx].type == "checkbox") {
            html += '<input type="checkbox" name="value" value="true" ' + (doc.fields[idx].value == 'true' ? 'checked' : '') + ' ' + attrib + '/>';
          }

          html += '</form>';
          html += '</td>'
          html += '</tr>';
        }

        for (filename in doc._attachments) {
          html += '<tr>';
          html += '<td style="vertical-align:top"><a href="#" class="attach-delete"><i class="icon-remove-sign"></i></a></td>';
          html += '<th style="white-space:nowrap;vertical-align:top">';
          html += '<a href="/' + p.settings.db_name + '/' + doc._id + '/' + filename +'" target="_new">' + filename + '</a>';
          html += '</th>';
          html += '<td><form class="block-attach"><input type="hidden" name="filename" value="' + filename + '"/></form></td>';
          html += '</tr>';
        }

        html += '</table>';
        html += '<a href="#" class="add btn">Add</a>';
        html += '<a href="#" class="attach btn" style="margin-left:5px">Attach</a>';

        $(elem).html(html);
      };

      return block;
    }()); // p.renderers.block

    /* render comments */
    renderers.comments = (function() {
      var comments = {};

      /* render comments for display */
      comments.view = function(doc, elem) {
        var html = '';
        for (i in doc.comments) {
          var c = doc.comments[i];
          html += '<div class="well">';
          html += '<strong>' + c.name + '</strong>';
          html += '<span style="float:right;font-size:xx-small">' + c.created + '</span>';
          html += '<hr/><div style="display:table-cell">' + c.text.replace(/(\r\n|\r|\n)/g, '<br/>') + '</div>';
          html += '</div>';
        }
        $(elem).html(html);
      };

      return comments;
    }()); // p.renderers.comments

    return renderers
  }()); // p.renderers

  return p
}()); // p

(function($) {
  /* serialize form data into object */
  $.fn.serializeObject = function()
  {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
      if (o[this.name] !== undefined) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  };
})(jQuery);

