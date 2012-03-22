function(doc, req) {
  if (doc._id == req.query.id) {
    return true;
  }
  else {
    return false;
  }
}
