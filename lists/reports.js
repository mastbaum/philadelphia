function(head, req) {
  var row;
  var d = {};
  while (row = getRow()) {
    if (row.value.type == "report")
      d[row.value._id] = {"id": row.value._id, "created": row.value.created};
    if (row.value.type == "subreport") {
      d[row.value.report_id]['summary'] = (row.value['Summary'] ? row.value['Summary'] : "");
      d[row.value.report_id]['run'] = (row.value['Run number'] ? row.value['Run number'] : "");
      d[row.value.report_id]['crew'] = (row.value['Crew'] ? row.value['Crew'] : "");
    }
  }
  var rows = [];
  for (key in d)
    rows.push(d[key]);

  return(JSON.stringify(rows));
}
