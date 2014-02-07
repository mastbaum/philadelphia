function(doc) {
  if (doc.type == "block") {
    emit([doc.report_id, doc._id], {
      editor_id: doc.editor_id,
      updated: doc.updated
    });
  }
}
