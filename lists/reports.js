function(head, req) {
  var row;
  var d = {};
  while (row = getRow()) {
    if (row.value.type == "report")
      d[row.value._id] = {"id": row.value._id, "created": row.value.created};
    if (row.value.type == "block" && row.value.name=="Basic Information") {
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
