function(doc) {
  if(doc.created)
    emit(doc._id, doc.created);
}
