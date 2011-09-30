function(doc) {
  if (doc.type=="subreport")
    for (key in doc)
      emit([key, doc.created], doc[key]);
}
