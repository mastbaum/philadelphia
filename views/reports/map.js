function(doc) {
  if (doc.type == "report")
    emit(doc.created, doc)
}
