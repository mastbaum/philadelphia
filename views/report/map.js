function(doc) {
  if (doc.type=="block")
      emit([doc.report_id, doc.created], doc)
}
