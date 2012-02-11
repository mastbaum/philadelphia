function(doc) {
  if (doc.type=="pin")
    emit(doc.board_id, doc)
}
