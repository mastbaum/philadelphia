function(doc) {
  if (doc.type == "report") {
    for (comment in doc.comments) {
      emit([doc._id, doc.comments[comment].created], doc.comments[comment]);
    }
  }
}
