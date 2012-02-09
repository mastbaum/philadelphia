/*
* Philadelphia 0.8 - The shift report system from the future
*
* Andy Mastbaum (amastbaum@gmail.com), 2011
*
* source: http://github.com/mastbaum/philadelphia
* bugs: http://github.com/mastbaum/philadelphia/issues
*/

/*
* Initialization
*/

var dbname = 'phila-8';

//window.onbeforeunload = function() {
//saveAllDocs();
//return "Are you sure you want to leave this page? All changes have been saved.";
//}

//// jquery plugins
(function($) {

  // serialize form data into object
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

  // load templates
  $.fn.loadTemplates = function(db, viewname) {
    var source = $(this);
    db.view(viewname, {
      success: function(data) {
        for (i in data.rows) {
          var template = $("div#template").clone(true);
          template.find(".template-name").html(data.rows[i].value.name);
          template.data('doc', data.rows[i].value).attr('id','').appendTo(source).show().draggable({
            connectToSortable: '#target',
            revert: 'invalid',
            helper: 'clone',
            opacity: 0.7
          });

          // start the user out with default templates
          if (data.rows[i].value['default'] == true) {
            var item = template.clone(true);
            // you'd think this would be automatic...
            jQuery.data(item, 'doc', data.rows[i].value);
            $("#target").append(item);
            item.buildBlock();
          }
        }
      }
    });
  }

  // write block to database
  $.fn.saveBlock = function(db) {
    var doc = $(this).find("form.block-meta").serializeObject();

    doc.fields = [];
    $(this).find("form.block-field").each(function(i) {
      doc.fields.push($(this).serializeObject());
    });

    // FIXME actually write to db
    console.log(doc);
  }

  $.fn.removeBlock = function(db) {
    $(this).remove();

    var id = $(this).find('input[name="_id"]').val();
    // FIXME actually delete doc
    /*
    var doc = db.openDoc(id, {
      success: function(data) {
        db.removeDoc(data, {
          success: function() {
            //console.log('deleted ' + id);
          },
          error: function() {
            alert('Unable to remove document ' + id);
          }
        });  
      }
    });
    */
  }

  // populate an element with an html representation of a block d
  // d can be a template or a sub-report
  $.fn.buildBlock = function(d) {
    this.removeClass('well');
    this.addClass('block');

    // templates include their doc
    if (!d) {
      d = jQuery.data(this, 'doc');
      d._id = $.couch.newUUID();
    }

    doc = d;

    if (!doc._id) {
      doc._id = $.couch.newUUID();
    }
    doc.created = (new Date());
    delete doc['_rev'];
    delete doc['default'];

    var html = '';

    html += '<div class="well" style="background:white;color:black">';
    html += '<a href="#" class="block-delete btn btn-danger" style="float:right;margin-left:5px">';
    html += '<i class="icon-trash icon-white"></i></a>';
    html += '<span style="font-size:large;font-weight:bold;">' + doc.name + '</span>';
    html += '<div class="timestamp" style="font-size:x-small">' + doc.created + '</div>';

    // hidden fields with report metadata
    html += '<form class="block-meta">';
    html += '<input type="hidden" name="_id" value="' + doc._id + '"/>'
    html += '<input type="hidden" name="report_id" value=""/>'
    html += '<input type="hidden" name="type" value="' + doc.type + '"/>'
    html += '<input type="hidden" name="name" value="' + doc.name + '"/>'
    html += '<input type="hidden" name="created" value="' + doc.created + '"/>'
    html += '</form>';

    html += '<table class="table table-condensed">';

    // form fields
    for (idx in doc.fields) {
      var attrib = doc.fields[idx].params || '';

      // FIXME replace required with attrib="required='required'"?
      if (doc.fields[idx].required) {
        attrib += ' required="required" ';
      }

      html += '<tr>';
      html += '<form class="block-field">';

      // hidden fields with field metadata
      html += '<input type="hidden" name="name" value="' + doc.fields[idx].name + '"/>';
      html += '<input type="hidden" name="attrib" value="' + doc.fields[idx].attrib + '"/>';
      html += '<input type="hidden" name="required" value="' + doc.fields[idx].required + '"/>';

      if (!doc.fields[idx].required) {
        html += '<td style="vertical-align:top"><a href="#" class="field-delete" onclick=""><i class="icon-remove-sign"></i></a></td>'; // FIXME onclick action
      }
      else {
        html += '<td></td>';
      }

      html += '<th style="white-space:nowrap;vertical-align:top">' + doc.fields[idx].name + '</th>';

      html += '<td style="width:100%">'
      if (doc.fields[idx].type == "text") {
        html += '<input value type="text" name="value" value="' + doc.fields[idx].value + '" ' + attrib + '/>';
      }
      else if (doc.fields[idx].type == "textarea") {
        html += '<textarea name="value" ' + attrib + '>' + doc.fields[idx].value + '</textarea>';
      }
      else if (doc.fields[idx].type == "checkbox") {
        html += '<input value="false" type="checkbox" name="value" ' + (doc.fields[idx].value == true ? 'checked' : '') + ' ' + attrib + '/>';
      }

      html += '</td>'

      html += '</form>';
      html += '</tr>';
    }
    html += '</table>';

    $(this).html(html);
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

// composer
function Composer(dbname) {
  // db
  this.db = $.couch.db(dbname);

  // editor
  this.autocompleteKeys = getAutocompleteKeyList();
  this.autosaveInterval = 0;
  this.currentControlId = 0;

  $("#source").loadTemplates(this.db, 'phila/templates');
  $("#target").append('<div id="drag_hint" style="padding:1em;">Drag templates here...</div>');

  // report
  this.report_id = $.couch.newUUID();
  this.report = $("#report");

  this.save = function() {
    $(".block").each(function(i) {
      $(this).saveBlock(this.db);
    });
  }

  this.report.buildReport({
    _id: this.report_id,
    type: 'report',
    created: (new Date())
  });
}

// global-ish so the bootstrap modal can call it
function removeBlock(id) {
  console.log('deleting');
  $("#delete-modal").modal('hide');
}

/*
* Helper functions
*/

// get list of all field names for autocomplete
function getAutocompleteKeyList() {
  var keys = [];
  $.ajax("/phila-8/_design/phila/_view/keylist", {
    dataType: 'json',
    async: false,
    data: 'group=true',
    success: function(data) {
      for (var i in data.rows)  {
        keys.push(data.rows[i].key);
      }
    }
  });
  return(keys);
}

//// Subreport helpers
/*
// display the "add new field" form, appended to element 'target'
function newFieldForm(target) {  
html = '<form class="add" action="">' +
'<tr>' +
'<td><input type="text" name="key" class="key" value="Field name"/></td>' +
'<td><input type="text" name="value" class="value" value="Value"></td>' +
'<td><input type="submit" value="Add" class="add"/></td>' +
'<td><input type="submit" value="Cancel" class="add_cancel"/></td>' +
'</tr>' +
'</form>';
target.append(html);
}

// display the "attach a file" form, appended to element 'target'
function addAttachForm(target) {
html = '<form class="attach" action="">' +
'<tr>' +
'<td><input type="file" name="_attachments" class="_attachments" value=""/></td>' +
'<td><input type="hidden" name="_rev" class="_rev"/></td>' +
'<td><input type="hidden" name="_id" class="_id"/></td>' +
'<td><input type="submit" value="Upload" class="attach"/></td>' +
'<td><input type="submit" value="Cancel" class="attach_cancel"/></td>' +
'</tr>' +
'</form>';
target.append(html);
}
*/
// add a new subreport to the shift report
// handles drop of template into report target
//
// 1. initializes new couchdb document
// 2. sets displayed and hidden fields
// 3. sets event handlers for all interactive elements
//
//
/*
function addSubreport(item) {

//// set handlers for new elements

// new fields
item.find("button.add").unbind('click').click(function(event) {
var addButton = $(this);
addButton.hide();
addNewFieldForm(addButton.parents("div.add"));
addButton.siblings("form.add").find("input.key").autocomplete({source: autocompleteKeys, delay: 0});
addButton.siblings("form.add").find("input.key").click(function(event) { $(event.target).val("") });
addButton.siblings("form.add").find("input.value").click(function(event) { $(event.target).val("") });

// cancel
addButton.parents().find("input.add_cancel").unbind('click').click(function(event) {
addButton.show();
addButton.siblings("form.add").remove();
return false;  
});

// add
addButton.parents().find("input.add").unbind('click').click(function(event) {
event.preventDefault();
var tgt = $(event.target);
var form = tgt.parents("form.add");  
$db.openDoc(id, {
success: function(data) {
var key = form.find("input.key").val();  
var val = form.find("input.value").val();
data[key] = val;
$db.saveDoc(data, {
success: function() {
//console.log('posted '+id+': '+JSON.stringify(data)); 
addButton.show();  
form.remove(); 
html = '<tr class="field">' +
'<td class="delete">' +
'<div class="key" style="display:none">' + key + '</div>' +
'<a href="#" class="delete"><div class="delete"><i class="icon-remove-sign"></i></div></a>' +
'</td>'+
'<td style="white-space:nowrap;vertical-align:top">' + key + '</td>' +
'<td style="width:100%">' +
'<input style="width:100%" value="' + val + '" type="text" name="' + key + '"/>' +
'</td>' +
'</tr>';
$("#"+id).find("table.fields").append(html);
},
error: function() {
alert('Unable to add or update document');
}
});  
return false;  
}
});
}); 
});

// attachments
item.find("button.attach").unbind('click').click(function(event) {
var attachButton = $(this);
attachButton.hide();
addAttachForm(attachButton.parents("div.attach"));  

// cancel
attachButton.parents().find("input.attach_cancel").unbind('click').click(function(event) {
attachButton.show();
attachButton.siblings("form.attach").remove();  
return false;  
});

// upload
attachButton.parents().find("input.attach").unbind('click').click(function(event) {
event.preventDefault();
$(this).attr('disabled', true);
var tgt = $(event.target);
var form = tgt.parents("form.attach");  

var data = {};
$.each(form.find(":input").serializeArray(), function(i, field) {
data[field.name] = field.value;
});

form.find("input._attachments").each(function() {
data[this.name] = this.value; // file inputs need special handling
});

if (!data._attachments || data._attachments.length == 0) {
alert("Please select a file to upload.");
return;
}

// disable saving during upload, would change revision
autosaveInterval = clearInterval(autosaveInterval);
$("button#save").attr("disabled", true);

$db.openDoc(id, {
success: function(data) {
form.find("input._id").val(data._id);
form.find("input._rev").val(data._rev);
// fixme: is this splitting robust?
var filename = form.find("._attachments").val().split('\\');
filename = filename[filename.length-1];
// post with ajaxSubmit; see jquery.form.js
form.ajaxSubmit({
url:  "/phila-8/" + data._id,
success: function(response) {
attachButton.show();
form.remove();
var html = '<tr class="field attachment">' +
'<td class="delete">' +
'<div class="key" style="display:none">' + filename + '</div>' +
'<a href="#" class="delete"><div class="delete"><i class="icon-remove-sign"></i></div></a>' +
'</td>'+
'<td style="white-space:nowrap;vertical-align:top"></td>' +
'<td style="width:100%">' +
'<a style="text-decoration:underline" href="/phila-8/'+id+'/'+filename+'" target="_new">'+filename+'</a>' +
'</td>' +
'</tr>';
$("#"+id).find("table.fields").append(html);
autosaveInterval = setInterval(function() {
saveAllDocs();
}, 10000);
$("button#save").attr("disabled", false);
}
});
return false;
}
});  
});
});

// field delete 'x' buttons
item.find("table.fields").unbind('click').click(function(event) {
var tgt = $(event.target);
if (tgt.hasClass("delete")) {
var tr = tgt.closest('div.field');
var fieldname = tr.find("div.key").text();
Boxy.confirm("Are you sure you wish to delete field " + fieldname + "?", function() {
var form = tgt.parents("form.update");
$db.openDoc(id, {
success: function(data) {
if (tr.hasClass('attachment')) {
$.ajax('/phila-8/' + id + '/' + fieldname + '?rev=' + data._rev, {
type: 'DELETE',
dataType: 'json',
success: function(data) {
tgt.parents("div.field").remove();
},
error: function(msg) {
alert('Unable to remove attachment: ' + msg);
}
});
}
else {
delete data[fieldname];
$db.saveDoc(data, {
success: function() {
//console.log('posted '+id+': '+JSON.stringify(data));
tgt.parents("div.field").remove();
},
error: function(msg) {
alert('Unable to add or update document: ' + msg);
}
});  
}
return false;  
}
});
}, {title: 'Delete'});
}
});
}
*/

/*
* document ready function
*/
$(document).ready(function() {

  $("button#save").live("click", function() {
    c.save();
  });

  $("a.block-delete").live('click', function() {
    var block = $(this).closest('div.block');
    $.fn.dialog2.helpers.confirm("Are you sure you wish to delete this block?", {
      confirm: function() {
        console.log('deleting');
        console.log(block);
        block.removeBlock();
      }
    });
    event.preventDefault();
  });

  $("a.field-delete").live('click', function() {
    $(this).closest('tr').remove();
  });

  var c = new Composer('phila-8');

    // ... but auto-save all the time
    //var d = new Date();
    //$("span#last_saved").html('Last saved: ' + d.toLocaleString());
    //autosaveInterval = setInterval(function() {
      //  saveAllDocs();
//}, 10000);

      // submit calls the triggers -- emails and pdf'ing
      /*
      $("button#submit").live('click', function() {
      $db.openDoc(report_id, {
      success: function(data) {
      //console.log(data)
      data.submitted = true;
      $db.saveDoc(data, {
      success: function(data) {
      saveAllDocs();
      //console.log('saved ' + id);
      },
      error: function() {
      alert('Unable to update document ' + report_id);
      }
      }); 
      return false;  
      }
      });
      window.onbeforeunload = function() { saveAllDocs(); };
      setTimeout(function() {
      window.location.href = 'index.html';
      }, 500);
      });
      */
      // set up report area as sortable
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
          var o = $(itemContext);
          o.attr("id", "control" + c.currentControlId++);
          jQuery.data(o, 'doc', ui.item.data('doc'));
          o.buildBlock();
        }
      });

});

