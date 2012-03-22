// utilities
function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null) return "";
  else return decodeURIComponent(results[1].replace(/\+/g, " "));
}

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
})(jQuery);

// database manipulation
// should namespace these
function createOrUpdateDocument(db, doc, preserve_fields) {
  db.openDoc(doc._id, {
    success: function(data) {
      doc._rev = data._rev;
      doc._attachments = data._attachments;
      if (preserve_fields) {
        for (i in preserve_fields) {
          doc[preserve_fields[i]] = data[preserve_fields[i]];
        }
      }
      db.saveDoc(doc, {
        success: function() {
          //console.log('updated');
        },
        error: function() {
          //console.log('error updating!');
        }});
    },
    error: function(e) {
      db.saveDoc(doc, {
        success: function() {
          //console.log('saved new');
        },
        error: function() {
          //console.log('error saving new!');
        }});
    }
  });
}

function removeDoc(db, id) {
  db.openDoc(id, {
    success: function(data) {
      db.removeDoc(data, {
        success: function() {
          console.log('deleted');
        },
        error: function() {
          console.log('error deleting');
        }
      });
    },
    error: function() {
      console.log('could not open to delete');
    }
  });
}

