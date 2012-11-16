function(head, req) {
  var row;
  var d = {};
  while (row = getRow()) {
    if (row.value.type == "report") {
      d[row.value._id] = {
        "id": row.value._id,
        "created": row.value.created,
        "comments": (row.value.comments ? row.value.comments.length : 0)
      };
    }
    if (row.value.type == "block" && row.value.name.substring(row.value.name.length-17, row.value.name.length)=="Basic Information") {
      for (idx in row.value.fields) {
        if (row.value.fields[idx].name == "Summary") {
          d[row.value.report_id]['summary'] = row.value.fields[idx].value;
        }
        if (row.value.fields[idx].name == "Run number") {
          d[row.value.report_id]['run'] = row.value.fields[idx].value;
        }
        if (row.value.fields[idx].name == "Crew") {
          d[row.value.report_id]['crew'] = row.value.fields[idx].value;
        }
      }
    }
  }
  var rows = [];
  for (key in d)
    rows.push(d[key]);

  return(JSON.stringify(rows));
}
