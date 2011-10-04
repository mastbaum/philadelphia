function(doc) {
  if(doc.type=="template") {
    var index = 0;
    for (key in doc.fields) {
      emit([doc._id, index, doc.fields[key].name], doc.fields[key]);
      index++;
    }
  }
}
