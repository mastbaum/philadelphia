function(doc, req) {
  if(doc.type == 'report') {
    if(doc.submitted && doc.emailed != true) {
      return true;
    }
    else {
      return false;
    }
  }
}
