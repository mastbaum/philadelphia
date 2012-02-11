function(doc) {
  if(doc.type=="board")
    emit(doc._id, {title: doc.title, created: doc.saved});
}
