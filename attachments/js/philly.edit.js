/* philly editor */

/* load page elements */
$('#header').load('header.html');
$('#footer').load('footer.html');

/* determine from query string if we're editing or creating a report */
var report_id = phila.tools.get_parameter_by_name('id');
var mode = report_id ? 'edit' : 'new';
phila.editor.report_id = report_id ? report_id : $.couch.newUUID();

/* event handlers */
// save every 5 seconds if changes have occurred
phila.editor.report_saved = false;
phila.editor.needs_save = {};

function save_if_needed() {
  if (!phila.editor.report_saved) {
    phila.editor.report_saved = true;
    phila.editor.save();
  }
  for (block_id in phila.editor.needs_save) {
    if (phila.editor.needs_save[block_id]) {
      var block = phila.editor.needs_save[block_id];
      phila.editor.needs_save[block_id] = false;
      phila.editor.save_block(block);
    }
  }
}

setInterval(function() {
  save_if_needed();
}, 5000);

$('input[name="value"]').live('keyup', function(event) {
  var block = $(this).closest('.block');
  var block_id = block.find('input[name="_id"]').val()
  phila.editor.needs_save[block_id] = block;
});

$('textarea').live('keyup', function(event) {
  var block = $(this).closest('.block');
  var block_id = block.find('input[name="_id"]').val()
  phila.editor.needs_save[block_id] = block;
});

$('input[type="checkbox"]').live('click', function(event) {
  var block = $(this).closest('.block');
  var block_id = block.find('input[name="_id"]').val()
  phila.editor.needs_save[block_id] = block;
});

// save everything on click of save button
$("button#save").live("click", function(event) {
  phila.editor.save();
});

// save and submit on click of submit button
$("button#submit").live("click", function(event) {
  $('<div class="modal"><div class="modal-header"><h3>Please wait</h3></div><div class="modal-body">Submitting report...</div><div class="modal-footer">&nbsp;</div></div>').modal('show');
  phila.editor.submit();
});

// confirm and delete block on click of block trash can button
$("a.block-delete").live('click', function(event) {
  event.preventDefault();
  var block = $(this).closest('div.block');
  $.fn.dialog2.helpers.confirm("Are you sure you wish to delete this block?", {
    confirm: function() {
      //console.log('deleting');
      var doc = block.find("form.block-meta").serializeObject();
      phila.tools.remove_doc(doc._id, block);
    }
  });
  phila.editor.save();
});

// delete field (without confirmation) on click of field's little 'x' 
$("a.field-delete").live('click', function(event) {
  event.preventDefault();
  var block = $(this).closest('.block');
  $(this).closest('tr').remove();
  phila.editor.save_block(block);
});

// delete attachment (without confirmation) on click of attachment's little 'x'
$("a.attach-delete").live('click', function(event) {
  event.preventDefault();
  var o = $(this);

  var id = o.parentsUntil('.well').parent().find('.block-meta').find('input[name="_id"]').val();
  var filename = o.closest('tr').find('input[name="filename"]').val();

  phila.tools.remove_attachment(id, filename, o.closest('tr'));
});

// show form to add field on click on 'add' button
$("a.add").live('click', function(event) {
  event.preventDefault();
  html = '<form class="field-add">' +
    '<table><tr>' +
    '<td><input type="text" name="key" value="Field name"/></td>' +
    '<td><input type="text" name="value" value="Value"></td>' +
    '<td><button class="btn btn-primary field-add-submit">Add</button></td>' +
    '<td><button class="btn field-add-cancel">Cancel</button></td>' +
    '</tr></table>' +
    '</form>';
  $(this).parent().append(html);
  $(this).parent().find('input[type="text"]').typeahead({source: phila.editor.keys}).click(function(event) {
    $(event.target).val('');
  });
  $(this).hide();
});

// hide field-adding form on click of field add cancel button
$(".field-add-cancel").live('click', function(event) {
  event.preventDefault();
  $(this).closest('form.field-add').hide();
  $(this).parentsUntil('.well').parent().find('a.add').show();
});

// add field to dom and save block on click of field add submit button
$(".field-add-submit").live('click', function(event) {
  event.preventDefault();
  $(this).parentsUntil('.well').parent().find('a.add').show();
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

  var block = $(this).closest('.block');
  phila.editor.save_block(block);
});

// show form to add attachment on click of 'attach' button
$("a.attach").live('click', function(event) {
  event.preventDefault();
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
  $(this).hide();
});

// hide attachment-adding form on click of attachment add cancel button
$(".field-attach-cancel").live('click', function(event) {
  event.preventDefault();
  $(this).closest('form.field-attach').hide();
  $(this).parentsUntil('.well').parent().find('a.attach').show();
});

// add attachment row to dom and save attachment on click of attachment add submit button
// FIXME hide some of this in phila.editor
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
  $("button#save").attr("disabled", true);

  phila.settings.db.openDoc(id, {
    success: function(doc) {
      form.find('input[name="_id"]').val(doc._id);
      form.find('input[name="_rev"]').val(doc._rev);

      // FIXME is this splitting robust?
      var filename = data._attachments.split('\\');
      filename = filename[filename.length-1];

      // post with ajaxSubmit; see jquery.form.js
      form.ajaxSubmit({
        url:  "/" + phila.settings.db_name + "/" + doc._id,
        success: function(response) {
          var html = '';
          html += '<tr>';
          html += '<td style="vertical-align:top"><a href="#" class="attach-delete"><i class="icon-remove-sign"></i></a></td>';
          html += '<th style="white-space:nowrap;vertical-align:top">';
          html += '<a href="/' + phila.settings.db_name + '/' + id + '/' + filename +'" target="_new">' + filename + '</a>';
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

$(document).ready(function() {
  $("#target").sortable({
    opacity: 0.7,
    dropOnEmpty: true,
    tolerance: 'pointer',
    placeholder: 'placeholder',
    cursor: 'move',
    beforeStop: function(event, ui) {
      // seems to be the only reliable way to access the helper object
      itemContext = ui.item.context;
    },
    receive: function (event, ui) {
      $('#drag_hint').fadeOut('slow');
      if ($(itemContext).hasClass('template')) {
        var doc_id = $(itemContext).find('input[name="id"]').val();
        $(itemContext).remove();
        var html = '<div class="block" style="margin:5px;padding:2px"></div>';
        var block = $(html);
        
        block.couchtools('load', {
          db_name: phila.settings.db_name,
          doc_id: doc_id,
          actions: [phila.renderers.block.edit]
        });

        //block.couchtools('update', {
        //  db_name: phila.settings.db_name,
        //  editor_id: phila.editor.editor_id,
        //  doc_id: doc_id,
        //  filter_name: 'phila/id',
        //  actions: [phila.renderers.block.edit]
        //});

        $("#target").append(block);
      }
    }
  });

  /* build the report from templates or existing data */
  if (mode == 'new') {
    phila.editor.init_report({
      _id: phila.editor.report_id,
      type: 'report',
      created: (new Date())
    });
    phila.editor.load_templates(true);
  }
  else if (mode == 'edit') {
    phila.settings.db.openDoc(phila.editor.report_id, {
      success: function(data) {
        phila.editor.init_report(data);
        phila.editor.load_templates(false);
        phila.settings.db.view("phila/report", {
          startkey: [phila.editor.report_id],
          endkey: [phila.editor.report_id, {}],
          success: function(data) {
            for (row in data.rows) {
              var doc = data.rows[row].value;
              html = '<div class="block" style="margin:5px;padding:2px"></div>';

              var block = $(html);
              
              block.couchtools('load', {
                db_name: phila.settings.db_name,
                doc_id: doc._id,
                actions: [phila.renderers.block.edit]
              });

              //block.couchtools('update', {
              //  db_name: phila.settings.db_name,
              //  editor_id: phila.editor.editor_id,
              //  doc_id: doc._id,
              //  filter_name: 'phila/id',
              //  actions: [phila.renderers.block.edit]
              //});

              block.appendTo('#target').draggable({
                connectToSortable: '#target',
                revert: 'invalid'
              });
            }
          },
          error: function() {
            //console.log('error opening report');
          }
        });
      }
    });
  }
});

