function(keys, values) {
  var row = {id:'', summary:'', run:'', crew:''};
  for (idx in values) {
    if (values[idx].type == "report") {
      row['id'] = values[idx]._id;
      row['created'] = values[idx].created;
    }
    if (values[idx].type == "subreport" && values[idx].subtype == "basic_template") {
      row['summary'] = values[idx]['Summary'] ? values[idx]['Summary'] : ''
      row['run'] = values[idx]['Run number'] ? values[idx]['Run number'] : ''
      row['crew'] = values[idx]['Crew'] ? values[idx]['Crew'] : ''
    }
  }
  return row;
}
