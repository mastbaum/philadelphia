function(doc) {
  if (doc.type=="block") {
    emit([doc.report_id, (new Date(doc.created)).toISOString()], doc);
  }
}
