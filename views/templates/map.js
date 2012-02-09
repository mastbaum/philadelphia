function(doc) {
  if(doc.type == "template")
    emit([doc.name, doc._id], doc);
}
