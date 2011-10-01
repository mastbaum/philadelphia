function(doc) {
  if (doc.type=="subreport")
    for (key in doc)
      emit(key, null);
}
