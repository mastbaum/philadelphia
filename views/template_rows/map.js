function(doc) {
  if(doc.type=="template")
      for (key in doc.fields)
          emit([doc._id, doc.fields[key].name], doc.fields[key]);
}
