function(doc, req) {
  if(doc.type == 'report') {
    return true;
  }
  else {
    return false;
  }
}
