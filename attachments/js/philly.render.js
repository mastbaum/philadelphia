dbname = 'phila';

var renderers = {
  'block': {
    'view': function(doc, elem) {
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

      $(elem).html(html);
    },
    'edit': function(doc, elem) {
      if (doc.type == 'template') {
        doc.type = 'block';
        doc._id = $.couch.newUUID(),
        delete doc._rev;
        doc.created = new Date();
      }

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

      html += '<table class="block-table table table-striped table-condensed">';

      // form fields
      for (idx in doc.fields) {
        var attrib = doc.fields[idx].attrib || '';

        if (doc.fields[idx].required) {
          attrib += ' required="required" ';
        }

        html += '<tr>';

        if (!doc.fields[idx].required) {
          html += '<td style="vertical-align:top"><a href="#" class="field-delete"><i class="icon-remove-sign"></i></a></td>';
        }
        else {
          html += '<td></td>';
        }

        html += '<th style="white-space:nowrap;vertical-align:top">' + doc.fields[idx].name + '</th>';
        html += '<td style="width:100%">'

        // hidden fields with field metadata
        html += '<form class="block-field">';
        html += '<input type="hidden" name="name" value="' + doc.fields[idx].name + '"/>';
        html += '<input type="hidden" name="attrib" value="' + doc.fields[idx].attrib + '"/>';
        html += '<input type="hidden" name="required" value="' + doc.fields[idx].required + '"/>';
        html += '<input type="hidden" name="type" value="' + doc.fields[idx].type + '"/>';

        if (doc.fields[idx].type == "text") {
          html += '<input class="field" type="text" name="value" value="' + (doc.fields[idx].value ? doc.fields[idx].value : '') + '" ' + attrib + '/>';
        }
        else if (doc.fields[idx].type == "textarea") {
          html += '<textarea name="value" ' + attrib + '>' + (doc.fields[idx].value ? doc.fields[idx].value : '') + '</textarea>';
        }
        else if (doc.fields[idx].type == "checkbox") {
          html += '<input type="checkbox" name="value" value="true" ' + (doc.fields[idx].value == 'true' ? 'checked' : '') + ' ' + attrib + '/>';
        }

        html += '</form>';
        html += '</td>'
        html += '</tr>';
      }

      for (filename in doc._attachments) {
        html += '<tr>';
        html += '<td style="vertical-align:top"><a href="#" class="attach-delete"><i class="icon-remove-sign"></i></a></td>';
        html += '<th style="white-space:nowrap;vertical-align:top">';
        html += '<a href="/' + dbname + '/' + id + '/' + filename +'" target="_new">' + filename + '</a>';
        html += '</th>';
        html += '<td><form class="block-attach"><input type="hidden" name="filename" value="' + filename + '"/></form></td>';
        html += '</tr>';
      }

      html += '</table>';
      html += '<a href="#" class="add btn">Add</a>';
      html += '<a href="#" class="attach btn" style="margin-left:5px">Attach</a>';

      $(elem).html(html);
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
}

