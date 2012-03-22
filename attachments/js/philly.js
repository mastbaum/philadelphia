/*
* Philadelphia 0.9 - The shift report system from the future
*
* Andy Mastbaum (amastbaum@gmail.com), 2012
*
* source: http://github.com/mastbaum/philadelphia
* bugs: http://github.com/mastbaum/philadelphia/issues
*/

// Settings
var dbname = 'phila';
var db = $.couch.db(dbname);
var id = getParameterByName('id');
var report_id = (id ? id : $.couch.newUUID());
/*
$.ajax("/" + dbname + "/_design/phila/_view/keylist", {
dataType: 'json',
data: 'group=true',
success: function(data) {
var keys = [];
for (var i in data.rows)  {
keys.push(data.rows[i].key);
}
$('input[name="key"]').typeahead({source: keys});
}
});
*/

var mode = id ? 'edit' : 'new'
console.log(mode);

load_templates(this.db, 'phila/templates', mode=='new');

function save() {
  $('#report').saveReport(db);
  $('input[name="report_id"]').val(report_id);
  $(".block").each(function(i) {
    $(this).saveBlock(db);
  });
}

function load_templates(db, viewname, load_defaults) {
  db.view(viewname, {
    success: function(data) {
      for (i in data.rows) {
        var doc = data.rows[i].value;
        var html = '<div class="well" style="margin:5px;padding:2px">';
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
          var block = $(html).couchtools('load', {
            db_name: dbname,
            doc_id: doc._id,
            actions: [renderers.block.edit]
          });
          $("#target").append(block);
        }
      }
      if (load_defaults) {
        $("#target").append('<div id="drag_hint" style="padding:1em;">Drag templates here...</div>');
      }
    }
  });
}

// event handlers
$('input[name="value"]').live('keyup', function(event) {
  save();
});

$('input[type="checkbox"]').live('click', function(event) {
  save();
});

$('textarea').live('keyup', function(event) {
  save();
});

$("button#save").live("click", function(event) {
  save();
});

$("button#submit").live("click", function(event) {
  db.openDoc(report_id, {
    success: function(data) {
      data.submitted = true;
      db.saveDoc(data, {
        success: function(data) {
          save();
          //console.log('saved');
          setTimeout(function() {
            window.location.href = 'index.html';
          }, 500);
        },
        error: function() {
          alert('Unable to update document ' + report_id);
        }
      }); 
      return false;  
    }
  });
});

$("a.block-delete").live('click', function(event) {
  event.preventDefault();
  var block = $(this).closest('div.block');
  $.fn.dialog2.helpers.confirm("Are you sure you wish to delete this block?", {
    confirm: function() {
      //console.log('deleting');
      block.removeBlock(c.db);
    }
  });
  save();
});

$("a.field-delete").live('click', function(event) {
  event.preventDefault();
  $(this).closest('tr').remove();
  save();
});

$("a.attach-delete").live('click', function(event) {
  event.preventDefault();
  var o = $(this);

  var id = o.parentsUntil('.well').parent().find('.block-meta').find('input[name="_id"]').val();
  var filename = o.closest('tr').find('input[name="filename"]').val();

  db.openDoc(id, {
    success: function(data) {
      $.ajax('/' + dbname + '/' + id + '/' + filename + '?rev=' + data._rev, {
        type: 'DELETE',
        success: function() {
          //console.log('deleted attachment');
          o.closest('tr').remove();
        },
        error: function() {
          alert('error deleting attachment');
        }
      });
    }
  });
});

$("a.add").live('click', function(event) {
  event.preventDefault();
  $(this).showFieldForm();
  $(this).parent().find('input[type="text"]').typeahead({source: c.keys}).click(function(event) {
    $(event.target).val('');
  });
  $(this).hide();
});

$(".field-add-cancel").live('click', function(event) {
  event.preventDefault();
  $(this).closest('form.field-add').hide();
  $(this).parentsUntil('.well').parent().find('a.add').show();
});

$(".field-add-submit").live('click', function(event) {
  event.preventDefault();
  $(this).parentsUntil('.well').parent().find('a.add').show();
  // FIXME move to $.fn
  var data = $(this).closest('form.field-add').hide().serializeObject();
  var html = '';
  html += '<tr>';
  html += '<td style="vertical-align:top"><a href="#" class="field-delete"><i class="icon-remove-sign"></i></a></td>';
  html += '<th style="white-space:nowrap;vertical-align:top">' + data.key + '</th>';
  html += '<td style="width:100%">'
  html += '<form class="block-field">';
  html += '<input type="hidden" name="name" value="' + data.key + '"/>';
  html += '<input type="hidden" name="type" value="text"/>';
  html += '<input class="field" type="text" name="value" value="' + data.value + '"/>';
  html += '</form>';
  html += '</td>'
  html += '</tr>';

  $(this).closest('.well').find('.block-table').append(html);
  save();
});

$("a.attach").live('click', function(event) {
  event.preventDefault();
  $(this).showAttachForm();
  $(this).hide();
});

$(".field-attach-cancel").live('click', function(event) {
  event.preventDefault();
  $(this).closest('form.field-attach').hide();
  $(this).parentsUntil('.well').parent().find('a.attach').show();
});


$(".field-attach-submit").live('click', function(event) {
  event.preventDefault();
  var form = $(this).closest('form.field-attach');
  var id = $(this).parentsUntil('.well').parent().find('.block-meta').find('input[name="_id"]').val();

  var data = {};
  $.each(form.find('input[type="hidden"]').serializeArray(), function(i, field) {
    data[field.name] = field.value;
  });

  form.find('input[type="file"]').each(function() {
    data[this.name] = this.value; // file inputs need special handling
  });

  if (!data._attachments || data._attachments.length == 0) {
    $("button#save").attr("disabled", false);
    alert("Please select a file to upload.");
    return;
  }

  // disable saving during upload, would change revision
  //autosaveInterval = clearInterval(autosaveInterval);
  $("button#save").attr("disabled", true);

  // FIXME move to composer?
  db.openDoc(id, {
    success: function(doc) {
      form.find('input[name="_id"]').val(doc._id);
      form.find('input[name="_rev"]').val(doc._rev);

      // FIXME is this splitting robust?
      var filename = data._attachments.split('\\');
      filename = filename[filename.length-1];

      // post with ajaxSubmit; see jquery.form.js
      form.ajaxSubmit({
        url:  "/" + dbname + "/" + doc._id,
        success: function(response) {
          var html = '';
          html += '<tr>';
          html += '<td style="vertical-align:top"><a href="#" class="attach-delete"><i class="icon-remove-sign"></i></a></td>';
          html += '<th style="white-space:nowrap;vertical-align:top">';
          html += '<a href="/' + dbname + '/' + id + '/' + filename +'" target="_new">' + filename + '</a>';
          html += '</th>';
          html += '<td><form class="block-attach"><input type="hidden" name="filename" value="' + filename + '"/></form></td>';
          html += '</tr>';

          form.closest('.well').find('.block-table').append(html);
          form.closest('.well').find('a.attach').show();
          form.hide();
          $("button#save").attr("disabled", false);
        },
        error: function(err) {
          $("button#save").attr("disabled", false);
        }
      });
      return false;
    }
  });
});

// Document ready function
$(document).ready(function() {
  $("#target").sortable({
    opacity: 0.7,
    dropOnEmpty: true,
    tolerance: 'pointer',
    placeholder: 'placeholder',
    cursor: 'move',
    beforeStop: function(event, ui) {
      itemContext = ui.item.context;
    },
    receive: function (event, ui) {
      $('#drag_hint').fadeOut('slow');
      var doc_id = $(itemContext).find('input[name="id"]').val();
      $(itemContext).remove();
      var html = '<div class="block" style="margin:5px;padding:2px"></div>';
      var block = $(html).couchtools('load', {
        db_name: dbname,
        doc_id: doc_id,
        actions: [renderers.block.edit]
      });
      $("#target").append(block);
    }
  });

  console.log('id: ' + id);
  if (id) {
    db.openDoc(id, {
      success: function(data) {
        $('#report').buildReport(data);
        db.view("phila/report", {
          startkey: [id],
          endkey: [id, {}],
          success: function(data) {
            for (row in data.rows) {
              var doc = data.rows[row].value;
              html = '<div class="block" style="margin:5px;padding:2px"></div>';

              var block = $(html).couchtools('load', {
                db_name: dbname,
                doc_id: doc._id,
                actions: [renderers.block.edit]
              });

              block.appendTo('#target').draggable({
                connectToSortable: '#target',
                revert: 'invalid'
              });
            }
            save();
          },
          error: function() {
            //console.log('error opening report');
          }
        });
      }
    });
  }
  else {
    console.log(report_id);
    $('#report').buildReport({
      _id: report_id,
      type: 'report',
      created: (new Date())
    });
    save();
  }
});

// jquery
(function($) {

  // write report to database
  $.fn.saveReport = function(db) {
    var doc = $(this).find("form.report-meta").serializeObject();
    console.log(doc)
    createOrUpdateDocument(db, doc, ['comments']);
  }

  // write block to database
  $.fn.saveBlock = function(db) {
    var doc = $(this).find("form.block-meta").serializeObject();

    doc.fields = [];
    $(this).find("form.block-field").each(function(i) {
      doc.fields.push($(this).serializeObject());
    });
    createOrUpdateDocument(db, doc);
  }

  $.fn.removeBlock = function(db) {
    $(this).remove();
    var doc = $(this).find("form.block-meta").serializeObject();
    removeDoc(db, doc);
  }

  // display the "add new field" form
  $.fn.showFieldForm = function() {
    html = '<form class="field-add">' +
      '<table><tr>' +
      '<td><input type="text" name="key" value="Field name"/></td>' +
      '<td><input type="text" name="value" value="Value"></td>' +
      '<td><button class="btn btn-primary field-add-submit">Add</button></td>' +
      '<td><button class="btn field-add-cancel">Cancel</button></td>' +
      '</tr></table>' +
      '</form>';
    $(this).parent().append(html);
  }

  // display the "attach a file" form
  $.fn.showAttachForm = function() {
    html = '<form class="field-attach" action="">' +
      '<table><tr>' +
      '<td><input type="file" name="_attachments" value=""/></td>' +
      '<td><input type="hidden" name="_rev"/></td>' +
      '<td><input type="hidden" name="_id"/></td>' +
      '<td><button class="btn btn-primary field-attach-submit">Upload</button></td>' +
      '<td><button class="btn field-attach-cancel">Cancel</button></td>' +
      '</tr></table>' +
      '</form>';
    $(this).parent().append(html);
  }

  // populate an element with a new report html
  $.fn.buildReport = function(d) {
    var html = '';
    html += '<form class="report-meta">';
    html += '<input type="hidden" name="_id" value="' + d._id + '"/>';
    html += '<input type="hidden" name="type" value="' + d.type + '"/>';
    html += '<input type="hidden" name="created" value="' + d.created + '"/>';
    html += '</form>';
    html += '<div id="target" style="background:white;padding-bottom:1.5em"></div>';

    var link_html = '<a style="font-size:xx-small;color:#00a;text-decoration:underline" href="view.html?id=' + d._id + '">' + d._id + '</a>';
    $("#report_id").html(link_html);
    $(this).append(html)
  }

})(jQuery);

