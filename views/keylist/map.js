function(doc) {
  if (doc.type=="block")
    for (idx in doc.fields)
      if (doc.fields[idx].name != '_attachments')
        emit(doc.fields[idx].name, null);
}

