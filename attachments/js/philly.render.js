var renderers = {
  'block': {
    'view': function(doc, elem) {
      console.log($(elem))
      console.log(doc)
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
          html += '<td style="width:100%;padding:3px;"><pre>' + doc.fields[field].value.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;") + '</pre></td>';
        }
        html += '</tr>';
      }

      for (file in doc._attachments) {
        html += '<tr>';
        html += '<th style="white-space:nowrap;padding:3px;">Attachment: </th>';
        html += '<td style="width:100%;padding:3px;"><a target="_new" href="/' + dbname + '/' + doc._id + '/' + file + '">' + file + '</a></td>';
        html += '</tr>';
      }

      html += '</table>';

      console.log(html);
      $(elem).html(html);
    },
    'edit': function(doc, elem) {
      return null;
    }
  },
  'comments': {
    'view': function(doc, elem) {
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
    }
  }
};

