function(doc) {
  if(doc.type=="template")
    for (key in doc.fields)
        emit([doc._id, key], doc.fields[key]);
}

