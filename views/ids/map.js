function(doc) {
  if(doc.number)
    emit(doc._id, doc.number);
}
