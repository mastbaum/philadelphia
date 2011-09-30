function(doc) {
  if(doc.type=="report")
    emit([doc._id,0], doc);
  if(doc.type=="subreport")
    emit([doc.report_id, 1], doc);
}
