/*
 * Philadelphia 0.5 - The shift report system from the future
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
var report_id = getUUID();
var d = new Date();

// all docs associated with this report
var doc_list = [];

// save report document
var doc = {
  _id: report_id,
  type: 'report',
  created: d
};
$db.saveDoc(doc, {
  async: false,
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

// thanks, s.o.! replace eventually with ajax query to couch?
function getUUID() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    var x = v.toString(16);
    return(x);
  });
}

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

// add new template-generated subdocument to report
function newDoc(id, doc_type, $doc) {
  $db.view("phila/template_rows", {
    data: 'startkey=["'+doc_type+'"]&endkey=["'+doc_type+'",{}]',
    success: function(data) {
      $("div#fields_"+id).html('');  
      for (i in data.rows) {
        // hack. query string ignored?
        if(data.rows[i].key[0] == doc_type) {
          var fieldname = data.rows[i].key[2];
          var required = data.rows[i].value.required;
          var nicename = data.rows[i].value.name;
          var params = data.rows[i].value.params || "";
          var entrytype = data.rows[i].value.type;
          html = '<tr class="field" id="id___'+id+'___'+fieldname+'"><td class="delete">';
          // no deleting fields marked as required in the template
          if (!required) {
            html += '<a href="#" id="id_' + id + '_' + fieldname + '" class="delete">' +
              '<div class="delete ui-icon ui-icon-circle-close"></div></a>';
          }
          html += '</td><td><label for="id_' + fieldname + '">' + nicename + '</label></td>';
          if (entrytype == "text")
            html += '<td><input value type="text" name="' + fieldname + '" id="id_' + fieldname + '" ' + params + '/></td>';
          if (entrytype == "textarea")
            html += '<td><textarea name="' + fieldname + '" id="id_' + fieldname + '" ' + params + '>&nbsp;</textarea></td>';
          if (entrytype == "checkbox")
            html += '<td><input value="false" type="checkbox" name="' + fieldname + '" id="id_' + fieldname + '" ' + params + '/></td>';
          html += '</tr>';
          $("div#fields_"+id).append(html);
          $doc[fieldname] = null;
        }
      }
    }
  });
  return($doc);
}

function saveAllDocs() {
  console.log('posting all docs');
  for (var i=0; i<doc_list.length; i++) {
    $.ajax('/phila/'+doc_list[i], {
      dataType: 'json',
      async: false,
      success: function(data) {
        var id = doc_list[i];
        var doc = $("form#id_"+id).serializeObject();
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

function addUpdateForm(id, target, existingDoc) {  
  html = '<form name="update_'+id+'" id="update_'+id+'" action="">' +  
    '<tr>' +
    '<td><input type="text" name="key" class="key" value="Field name"/></td>' +  
    '<td><input type="text" name="value" class="value" value="Value"></td>' +   
    '<td><input type="submit" name="submit" class="update_'+id+'" value="Add"/></td>' +   
    '<td><input type="submit" name="cancel" class="cancel_'+id+'" value="Cancel"/></td>' +   
    '</tr>' +  
    '</form>';  
  target.append(html);  
  target.children("form#update_"+id).data("existingDoc", existingDoc);
}

// all the magic happens when we drop the draggable:
//
// 1. set uuid and timestamp fields
// 2. create and post new couch document
// 3. add all ui handlers for document elements
//
function addDoc(item) {
  var id = getUUID();
  doc_list.push(id);
  var d = new Date();

  // initialize document
  var $doc = {};
  var doc_type = item.find('input.template-type').val();
  $doc.subtype = doc_type;
  $doc.type = "subreport";
  $doc.report_id = report_id;
  $doc._id = id;
  $doc.created = d;

  // populate div and form elements
  item.find('input.report_id').val($doc.report_id);
  item.find('input.type').val($doc.type);
  item.find('input.subtype').val($doc.subtype);

  item.find('div.docid').html($doc._id);
  item.find('input._id').val($doc._id);
  item.find('div.timestamp').html($doc.created.toLocaleString());
  item.find('input.created').val($doc.created);

  item.find('form').attr('id', 'id_' + id);
  item.find('div#fields').attr('id', 'fields_' + id);
  item.find('#add').attr('id', 'add_' + id);
  item.find('#save').attr('id', 'save_' + id);

  // build doc from template fields
  $doc = newDoc(id, doc_type, $doc);
  item.find('div.template-content').fadeIn(1000);

  // fixme need to make sure ajax in newDoc is really sync
  setTimeout(function() {
    $db.saveDoc($doc, {
      async: false,
      success: function() {
        console.log('posted '+id+': '+JSON.stringify($doc)); 
      },
      error: function() {
        alert('Unable to add or update document');
      }
    });
  }, 500);

  // set handlers for new field ui
  $("button#add_"+id).live('click', function(event) {
    $("form#update_"+id).remove(); 
    $("button#add_"+id).hide();
    addUpdateForm(id, $("div#add_"+id));  
  }); 

  $("input.cancel_"+id).live('click', function(event) {  
    $("button#add_"+id).show();
    $("form#update_"+id).remove();  
    return false;  
  });

  $("input.update_"+id).live('click', function(event) {
    event.preventDefault();
    var $tgt = $(event.target);  
    var $form = $tgt.parents("form#update_"+id);  
    var $doc = $db.openDoc(id, {
      async: false,
      success: function(data) {
        var key = $form.find("input.key").val();  
        var val = $form.find("input.value").val();
        data[key] = val;
        $db.saveDoc(data, {
          success: function() {
            console.log('posted '+id+': '+JSON.stringify(data)); 
            $("button#add_"+id).show();  
            $("form#update_"+id).remove(); 
            html = '<tr class="field" id="id___'+id+'___'+key+'">' +
              '<td class="delete"><a href="#" id="id_' + id + '_' + key + '" class="delete"><div class="delete ui-icon ui-icon-circle-close"></div></a> </td>'+
              '<td><label for="id_' + key + '">' + key + '</label></td>';
            html += '<td><input value="' + val + '" type="text" name="' + key + '" id="id_' + key + '"/></td></tr>';
            $("div#fields_"+id).append(html);

          },
          error: function() {
            alert('Unable to add or update document');
          }
        });  
        return false;  
      }
    });
  }); 

  $("div#fields_"+id).live('click', function(event) {
    var $tgt = $(event.target);  
    if ($tgt.is('div') || $tgt.is('a')) {
      if ($tgt.hasClass("delete")) {  
        var fieldname = $tgt.closest('tr').attr('id').split('___')[2];
        Boxy.confirm("Are you sure you wish to delete field " + fieldname + "?", function() {
          var $form = $tgt.parents("form#update_"+id);  
          var $doc = $db.openDoc(id, {
            async: false,
            success: function(data) {
              delete data[fieldname];
              $db.saveDoc(data, {
                success: function() {
                  console.log('posted '+id+': '+JSON.stringify(data)); 
                  $tgt.parents("tr.field").remove();
                },
                error: function() {
                  alert('Unable to add or update document');
                }
              });  
              return false;  
            }
          });
        }, {title: 'Delete'});
      }
    }
  });

}

/*
* document ready function
*/
$(document).ready(function() {
  $('span#report_id').html('Link: <a href="view.html?id='+report_id+'">'+report_id+'</a>');

  // save button makes everyone feel happy
  $("button#save").live('click', function() {
    saveAllDocs();
  });

  // ... but auto-save all the time
  var d = new Date();
  $("span#last_saved").html('Last saved: ' + d.toLocaleString());
  setInterval(function() {
    saveAllDocs();
  }, 10000);

  // create templates
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

      }
      // start the user out with a basic_template
      var item = $("div.basic_template").clone().fadeIn(0);
      $("#target").prepend(item);
      addDoc(item);
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
      addDoc($(itemContext));
    }
  });

});

