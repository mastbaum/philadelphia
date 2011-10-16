/*
* Philadelphia 0.7 - The shift report system from the future
*
* Andy Mastbaum (amastbaum@gmail.com), 2011
*
* github: http://github.com/mastbaum/philadelphia
* bugs: http://github.com/mastbaum/philadelphia/issues
*/

/*
* Initialization
*/

window.onbeforeunload = function() {
  saveAllDocs();
  return "Are you sure you want to leave this page? All changes have been saved.";
}

$db = $.couch.db("phila");
var report_id = $.couch.newUUID(20);

// all docs associated with this report
var doc_list = [];

// save report document
var doc = {
  _id: report_id,
  type: 'report',
  created: (new Date())
};

$db.saveDoc(doc, {
  success: function() {
    console.log('posted report doc ' + report_id);
  },
  error: function() {
    alert('Unable to create report document');
  }
});

// keep track of draggables
var currentControlId = 0;

/*
* Helper functions
*/

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

// validate form fields
function validate(element, validator) {
  if (validator) {
    element.removeClass("bad");
  }
  else {
    element.addClass("bad");
  }
}

//// Report helpers

// loop through and save all docs related to this report
function saveAllDocs() {
  console.log('posting all docs');
  for (var i=0; i<doc_list.length; i++) {
    $.ajax('/phila/'+doc_list[i], {
      dataType: 'json',
      async: false,
      success: function(data) {
        var id = doc_list[i];
        var doc = $("#"+id).find("form.fields").serializeObject();
        for (key in doc) {
          if(key!="_id" && key!="_rev") {
            if (!(key in data))
              data[key] = null;
            else
              data[key] = doc[key];
          }
        }
        console.log('posting ' + data._id + ': ' + JSON.stringify(data));
        $db.saveDoc(data, {
          success: function() {
            console.log('posted ok ' + report_id);
            var d = new Date();
            $("span#last_saved").html('Last saved: ' + d.toLocaleString());
          },
          error: function() {
            alert('Unable to save document ' + id);
          }
        });
      },
      error: function() {
        alert('Unable to open document ' + id + ' for saving');
      }
    });
  }
}

//
// Subreport helpers
//

// add new template-generated subdocument element to report
function addSubreportElement(id, doc_type) {
  $db.view("phila/template_rows", {
    success: function(data) {
      for (i in data.rows) {
        if(data.rows[i].key[0] == doc_type) {
          var value = data.rows[i].value;
          var fieldname = data.rows[i].key[2];
          var params = value.params || "";
          var required = value.required;
          var name = value.name;
          var entrytype = value.type;

          if (required) {
            params += ' class="required" ';
          }

          html = '<tr class="field ' + fieldname + '">';

            if (!required) {
              html += '<td class="delete">' +
                '<div class="key" style="display:none">' + fieldname + '</div>' +
                '<a href="#" class="delete"><div class="delete ui-icon ui-icon-circle-close"></div></a>' +
                '</td>';
            }
            else {
              html += '<td><div class="key" style="display:none">' + fieldname + '</div></td>';
            }

            html += '<td>' + name + '</td>';

            if (entrytype == "text")
              html += '<td><input value type="text" name="' + fieldname + '" ' + params + '/></td>';
            if (entrytype == "textarea")
              html += '<td><textarea name="' + fieldname + '"  ' + params + '></textarea></td>';
            if (entrytype == "checkbox")
              html += '<td><input value="false" type="checkbox" name="' + fieldname + '" ' + params + '/></td>';

            html += '</tr>';
            $("#target").find("#"+id).find("div.fields").append(html);
        }
      }
    }
  });
}

// remove a subreport from the database
function removeSubreport(id) {
  Boxy.confirm("Are you sure you wish to delete block " + id + "?<br/><br/>Note that this is an <b>irreversible</b> operation.", function() {
    var $doc = $db.openDoc(id, {
      success: function(data) {
        $db.removeDoc(data, {
          success: function() {
            console.log('deleted ' + id);
            doc_list.splice(doc_list.indexOf(id), 1);
            $('#'+id).fadeOut(1000)
            setTimeout(function() { 
              $('#'+id).remove();
            }, 1000);
          },
          error: function() {
            alert('Unable to remove document');
          }
        });  
        return false;  
      }
    });
  }, {title: 'Delete'});
}

// display the "add new field" form, appended to element 'target'
function addNewFieldForm(target) {  
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

// add a new subreport to the shift report
// handles drop of template into report target
//
// 1. initializes new couchdb document
// 2. sets displayed and hidden fields
// 3. sets event handlers for all interactive elements
//
function addSubreport(item) {
  // initialize document
  var id = $.couch.newUUID();
  doc_list.push(id);

  var doc = {};
  var doc_type = item.find('input.template-type').val();
  doc.subtype = doc_type;
  doc.type = "subreport";
  doc.report_id = report_id;
  doc._id = id;
  doc.created = (new Date());

  // populate div and form elements
  item.attr('id', id);
  item.find('input.report_id').val(doc.report_id);
  item.find('input._id').val(doc._id);
  item.find('input.type').val(doc.type);
  item.find('input.subtype').val(doc.subtype);
  item.find('input.created').val(doc.created);

  item.find('div.docid').html(doc._id);
  item.find('div.timestamp').html(doc.created.toLocaleString());

  // build doc from template fields
  addSubreportElement(id, doc_type);

  // make subreport visible
  item.find('div.template-content').fadeIn(1000);
  item.find('a.subreport_delete').fadeIn(1000);

  // create subreport document in database
  setTimeout(function() {
    $db.saveDoc(doc, {
      success: function() {
        console.log('posted '+id+': '+JSON.stringify(doc)); 
      },
      error: function() {
        alert('Unable to add or update document');
      }
    });
  }, 500);

  //// set handlers for new elements

  // report delete
  item.find('a.subreport_delete').unbind('click').click(function(event) {
    event.preventDefault();
    subreport_delete(id);
  });

  // new fields
  item.find("button.add").unbind('click').click(function(event) {
    var addButton = $(this);
    addButton.hide();
    addNewFieldForm(addButton.parents("div.add"));  

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
              console.log('posted '+id+': '+JSON.stringify(data)); 
              addButton.show();  
              form.remove(); 
              html = '<tr class="field">' +
                '<td class="delete">' +
                '<div class="key" style="display:none">' + key + '</div>' +
                '<a href="#" class="delete"><div class="delete ui-icon ui-icon-circle-close"></div></a>' +
                '</td>'+
                '<td>' + key + '</td>' +
                '<td><input value="' + val + '" type="text" name="' + key + '"/></td>' +
                '</tr>';
              $("#"+id).find("div.fields").append(html);
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

      $db.openDoc(id, {
        success: function(data) {
          form.find("input._id").val(data._id);
          form.find("input._rev").val(data._rev);
          // fixme: is this splitting robust?
          var filename = form.find("._attachments").val().split('\\');
          filename = filename[filename.length-1];
          // post with ajaxSubmit; see jquery.form.js
          form.ajaxSubmit({
            url:  "/phila/" + data._id,
            success: function(response) {
              attachButton.show();
              form.remove();
              var html = '<tr class="field attachment">' +
                '<td class="delete">' +
                '<div class="key" style="display:none">' + filename + '</div>' +
                '<a href="#" class="delete"><div class="delete ui-icon ui-icon-circle-close"></div></a>' +
                '</td>'+
                '<td></td>' +
                '<td><a style="text-decoration:underline" href="/phila/'+id+'/'+filename+'" target="_new">'+filename+'</a></td>' +
                '</tr>';
              $("#"+id).find("div.fields").append(html);
            }
          });
          return false;
        }
      });  
    });
  });

  // field delete 'x' buttons
  item.find("div.fields").unbind('click').click(function(event) {
    var tgt = $(event.target);
    if (tgt.hasClass("delete")) {
      var tr = tgt.closest('tr');
      var fieldname = tr.find("div.key").text();
      Boxy.confirm("Are you sure you wish to delete field " + fieldname + "?", function() {
        var form = tgt.parents("form.update");
        $db.openDoc(id, {
          success: function(data) {
            if (tr.hasClass('attachment')) {
              $.ajax('/phila/' + id + '/' + fieldname + '?rev=' + data._rev, {
                type: 'DELETE',
                dataType: 'json',
                success: function(data) {
                  tgt.parents("tr.field").remove();
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
                  console.log('posted '+id+': '+JSON.stringify(data));
                  tgt.parents("tr.field").remove();
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

/*
* document ready function
*/
$(document).ready(function() {
  $('span#report_id').html('Link: <a href="view.html?id='+report_id+'">'+report_id+'</a>');

  // live validation of form elements
  $("input.required").each(function(i) {
    validate($(this), $(this).val() !== '');
  });

  $("input.required").live('change', function(i) {
    validate($(this), $(this).val() !== '');
  });

  // save button makes everyone feel happy ...
  $("button#save").live('click', function() {
    saveAllDocs();
  });

  // ... but auto-save all the time
  var d = new Date();
  $("span#last_saved").html('Last saved: ' + d.toLocaleString());
  setInterval(function() {
    saveAllDocs();
  }, 10000);

  // populate template bin
  $db.view('phila/templates', {
    success: function(data) {
      for (i in data.rows) {
        var template = $("div.template").clone();
        template.find(".template-name").html(data.rows[i].key[0]);
        template.find(".template-type").val(data.rows[i].key[1]);
        template.draggable({
          connectToSortable: '#target',
          revert: 'invalid',
          helper: 'clone',
          opacity: 0.7
        });
        template.removeClass('template')
        template.addClass(data.rows[i].key[1])
        $("div#source").append(template.fadeIn(0));

        // start the user out with default templates
        if (data.rows[i].value) {
          var item = $("div."+data.rows[i].key[1]).clone();
          $("#target").append(item);
          addSubreport(item);
        }
      }
      // "drop templates here" hint
      $("#target").append('<div id="drag_hint" class="ui-state-disabled" style="padding:1em;">Drag templates here...</div>');
    }
  });

  // set up report area as sortable
  $( "#target" ).sortable({
    accept: ".item",
    opacity: 0.7,
    dropOnEmpty: true,
    tolerance: 'pointer',
    placeholder: 'placeholder',
    cursor: 'move',
    beforeStop: function (event, ui) { itemContext = ui.item.context;},
    receive: function (event, ui) {
      $(itemContext).attr("id", "control" + currentControlId++);
      $('#drag_hint').fadeOut('slow');
      addSubreport($(itemContext));
    }
  });
});

