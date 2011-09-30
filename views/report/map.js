function(doc) {
  if (doc.type=="subreport")
      emit([doc.report_id, doc.created], doc)
}
