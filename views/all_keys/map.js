function(doc) {
  if (doc.type == "block") {
    for (idx in doc.fields) {
      if (doc.fields[idx].name.substring(0,1) != '_') {
        emit([doc.fields[idx].name, doc.created], {report_id: doc.report_id, value: doc.fields[idx].value});
      }
    }
  }
}
