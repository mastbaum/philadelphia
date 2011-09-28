//
// initialization
//

$db = $.couch.db("phila");
var report_id = getUUID();

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

function refreshDoc(id, doc_type, $doc) {
  $db.view("phila/template_rows", {
    async: false,
    global: true,
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
            html += '<td><input value="word" type="text" name="' + fieldname + '" id="id_' + fieldname + '" ' + params + '/></td>';
          if (entrytype == "textarea")
            html += '<td><textarea name="' + fieldname + '" id="id_' + fieldname + '" ' + params + '>heyoo</textarea></td>';
          html += '</tr>';
          $("div#fields_"+id).append(html);
          $doc[fieldname] = null;
        }
      }  
    }
  });
  return($doc);
}

// all the magic happens when we drop the draggable:
//
// 1. set uuid and timestamp fields
// 2. create and post new couch document
// 3. add all ui handlers for document elements
//
function addDoc( item ) {
  var id = getUUID();
  item.find('div.docid').html(id);
  item.find('form').attr('id', 'id_' + id);
  item.find('div#fields').attr('id', 'fields_' + id);
  item.find('#add').attr('id', 'add_' + id);
  var d = new Date();
  item.find('div.timestamp').html(d.toLocaleString());
  item.find('div.inner').fadeIn(1000);
  var doc_type = item.find('input.template').val();

  var $doc = {};
  $doc.type = "subreport";
  $doc.report_id = report_id;
  $doc._id = id;
  $doc.created = d;

  $doc = refreshDoc(id, doc_type, $doc);

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


  $("button#add_"+id).live('click', function(event) {
    alert('click add button');
    $("form#update_"+id).remove(); 
    $("button#add_"+id).hide();
    addUpdateForm(id, $("div#add_"+id));  
  }); 

  $("input.cancel_"+id).live('click', function(event) {  
    alert('click cancel button');
    $("button#add_"+id).show();
    $("form#update_"+id).remove();  
    return false;  
  });

  $("input.update_"+id).live('click', function(event) {  
    alert('click update button');
    var $tgt = $(event.target);  
    var $form = $tgt.parents("form#update_"+id);  
    var $doc = $form.data('existingDoc') || {};  
    $doc.type = "thing";  
    $doc._id = $form.find("input#_id").val();  
    $doc.number = $form.find("input#number").val();  
    $db.saveDoc($doc, {
      success: function() {  
        $("button#add_"+id).show();  
        $("form#update_"+id).remove(); 
        refreshDoc(id, doc_type, {}) 
        //refreshAddressbook();  
      },
      error: function() {
        alert('Unable to add or update document');
      }
    });  
    return false;  
  }); 

  $("div#fields_"+id).live('click', function(event) {  
    alert('click fields');
    var $tgt = $(event.target);  
    event.preventDefault(); 
    if ($tgt.is('a')) {  
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

function addUpdateForm(id, target, existingDoc) {  
  html = '<form name="update_'+id+'" id="update_'+id+'" action="">' +  
    '<tr>' +
    '<td><input type="text" name="key" value="Field name"/></td>' +  
    '<td><input type="text" name="number" value="Value"></td>' +   
    '<td><input type="submit" name="submit" class="update_'+id+'" value="Add"/></td>' +   
    '<td><input type="submit" name="cancel" class="cancel_'+id+'" value="Cancel"/></td>' +   
    '</tr>' +  
    '</form>';  
  target.append(html);  
  target.children("form#update_"+id).data("existingDoc", existingDoc);
}

//
// doc ready function
//
$(document).ready(function() {   
  $('.docid').html(getUUID());

  $( ".item" ).draggable({
    connectToSortable: '#target',
    cursor: 'move',
    revert: 'invalid',
    helper: 'clone',
    opacity: 0.7
  })


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
      //$(itemContext).css("background", "red");
      $('#drag_hint').fadeOut('slow');
      addDoc($(itemContext));
    }
  });
}); 
