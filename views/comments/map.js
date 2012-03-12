function(doc) {
  if (doc.type == "report") {
    for (comment in doc.comments) {
      var d = new Date(doc.comments[comment].created);
      emit([doc._id, d], doc.comments[comment]);
    }
  }
}
