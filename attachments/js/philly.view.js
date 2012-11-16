/* philly viewer */

/* load page element */
$('#header').load('header.html');
$('#footer').load('footer.html');

/* get id from query string */
var report_id = phila.tools.get_parameter_by_name('id');

/* event handlers */
// add comment to dom and save to db on submit button click
$("#comment-submit").unbind('click').click(function(event) {
  event.stopPropagation();
  event.preventDefault();
  if ($("input#comment-name").val() == "" || $("textarea#comment-text").val() == "") {
    alert("Name and comment are required fields");
    return false;
  }
  phila.settings.db.openDoc(report_id, {
    success: function(data) {
      var comment = {
        name: $("input#comment-name").val(),
        text: $("textarea#comment-text").val(),
        created: (new Date()).toString()
      };
      if ('comments' in data) {
        data.comments.push(comment);
      }
      else {
        data['comments'] = [comment];
      }
      phila.settings.db.saveDoc(data, {
        success: function(data) {
          $('#comments').couchtools('load');
          $("textarea#comment-text").val('');
        },
        error: function() {
          alert('Failed to post comment');
        }
      });
    },
    error: function() {
      alert('Failed to post comment');
    }
  });
});

/* delete report */
function delete_report() {
  $(".block").each(function(e) {
    var block_id = $(this).attr('id');
    phila.tools.remove_doc(block_id);
  });
  phila.tools.remove_doc(report_id);

  setTimeout(function() {
    window.location.href = 'index.html';
  }, 1000);
}

$(document).ready(function() {
  /* fill in some metadata */
  $("span#report_id").html('DOCUMENT ID: ' + report_id);
  $("a#edit").attr('href', 'edit.html?id=' + report_id);
  phila.settings.db.openDoc(report_id, {
    success: function(data) {
      if (data.submitted == true) {
        $("a#edit").attr("disabled", "true");
        $("a#edit").attr('href', '#');
        $("a#delete").attr("disabled", "true");
        $("a#delete").attr('href', '#');
      }
    }
  });

  /* build report */
  phila.settings.db.view("phila/report", {
    startkey: [report_id],
    endkey: [report_id, {}],
    success: function(data) {
      for (i in data.rows) {
        var doc = data.rows[i].value;
        var html ='<div style="background:white;color:black" class="well block" id="' + doc._id + '"></div>';
        var block = $(html);
        
        block.couchtools('load', {
          db_name: phila.settings.db_name,
          doc_id: doc._id,
          actions: [phila.renderers.block.view]
        });

        block.couchtools('update', {
          base_url: phila.settings.url_prefix,
          db_name: phila.settings.db_name,
          editor_id: 'none',
          doc_id: doc._id,
          filter_name: 'phila/id',
          actions: [phila.renderers.block.view]
        });

        block.appendTo('#report');
      }
    }
  });

  /* load comments */
  $('#comments').couchtools('load', {
    db_name: phila.settings.db_name,
    doc_id: report_id,
    actions: [phila.renderers.comments.view]
  });
});

