//
// initialization
//
window.onbeforeunload = function() {
  return "Are you sure you want to leave this page?";
}

$db = $.couch.db("phila");
var report_id = getUUID();

// all docs associated with this report
var doc_list = [];

// save report document
var doc = {};
doc._id = report_id;
doc.type = 'report';
var d = new Date();
doc.created = d;
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

//
// helper functions
//

// thanks, s.o.! replace eventually with ajax query to couch?
function getUUID() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    var x = v.toString(16);
    return(x);
  });
}

function newDoc(id, doc_type, $doc) {
  $db.view("phila/template_rows", {
    async: false,
    //data: query_key,
    success: function(data) {
      $("div#fields_"+id).html('');  
      for (i in data.rows) {
        var dtype = data.rows[i].key[0];
        //fixme get query string to work
        if (dtype == doc_type) {
          var fieldname = data.rows[i].key[1];
          var nicename = data.rows[i].value.name;
          var params = data.rows[i].value.params || "";
          var entrytype = data.rows[i].value.type;
          html = '<tr class="address">' +
            '<td class="delete"><a href="#" id="' + id + '" class="delete"><div class="ui-icon ui-icon-circle-close"></div></a> </td>'+
            '<td><label for="id_' + fieldname + '">' + nicename + '</label></td>';
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
          async: false,
          success: function() {
            console.log('posted ok ' + report_id);
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
function addDoc( item ) {
  var id = getUUID();
  doc_list.push(id);
  var d = new Date();

  // initialize document
  var $doc = {};
  var doc_type = item.find('input.template').val();
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
  item.find('div.inner').fadeIn(1000);

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
            html = '<tr class="address">' +
              '<td class="delete"><a href="#" id="' + id + '" class="delete"><div class="ui-icon ui-icon-circle-close"></div></a> </td>'+
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
    event.preventDefault(); 
    if ($tgt.is('a')) {  
      alert('is this ever called?');
      id = $tgt.attr("id");
      if ($tgt.hasClass("edit")) {  
        $("button#add_"+id).show();  
        $db.openDoc(id, {
          success: function(doc) {  
            addUpdateForm(id, $tgt.parent(), doc);  
          }
        });        
      }  
      if ($tgt.hasClass("delete")) {  
        html = '<span class="deleteconfirm">Sure? <a href="#" id="'+id+'" class="dodelete">Yes</a> <a href="#" class="canceldelete">No</a></span>';  
        $tgt.parent().append(html);  
      }  
      if ($tgt.hasClass("dodelete")) {
        $db.openDoc(id, { 
          success: function(doc) {
            $db.removeDoc(doc, {
              success: function() {
                $tgt.parents("div.address").remove();
              },
              error: function() {
                alert('Unable to remove document ' + id);
              }
            });  
          },
          error: function() {
            alert('Unable to open docuemnt ' + id);
          }
        });        
      }  
      if ($tgt.hasClass("canceldelete")) {  
        $tgt.parents("span.deleteconfirm").remove();  
      }  
    }  
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

// doc ready function
$(document).ready(function() {
  // set report doc's uuid
  $('.docid').html(getUUID());

  // save button makes everyone feel happy
  $("button#save").live('click', function() {
    saveAllDocs();
  });

  // jquery ui elements
  $( ".item" ).draggable({
    connectToSortable: '#target',
    cursor: 'move',
    revert: 'invalid',
    helper: 'clone',
    opacity: 0.7
  });

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

