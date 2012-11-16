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
        var doc = d[row.value.report_id] || {
          summary: 'invalid report id',
          run: 'invalid report id',
          crew: 'invalid report id'
        };
        if (row.value.fields[idx].name == "Summary") {
          doc['summary'] = row.value.fields[idx].value;
        }
        if (row.value.fields[idx].name == "Run number") {
          doc['run'] = row.value.fields[idx].value;
        }
        if (row.value.fields[idx].name == "Crew") {
          doc['crew'] = row.value.fields[idx].value;
        }
      }
    }
  }
  var rows = [];
  for (key in d)
    rows.push(d[key]);

  return(JSON.stringify(rows));
}
