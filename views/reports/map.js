function(doc) {
  if(doc.type=="report") {
    var comment_cnt = 0;
    if (doc.comments) comment_cnt = doc.comments.length;
    emit([doc._id], {id: doc._id, created: doc.created, comments: comment_cnt, attchs: 0});
  }
  if (doc.type=="block") {
    var val = {attchs: 0};
    if (doc._attachments) {
      var cnt = 0;
      for (var prop in doc._attachments) {
        if (doc._attachments.hasOwnProperty(prop)) {
          cnt = cnt + 1;
        }
      }
      val['attchs'] = cnt;
    }
    if (doc.name.substring(doc.name.length-17, doc.name.length)=="Basic Information") {
      for (var idx=0; idx < doc.fields.length; idx++) {
        if (doc.fields[idx].name == "Summary") {
          val['summary'] = doc.fields[idx].value;
        }
        if (doc.fields[idx].name == "Run number") {
          val['run'] = doc.fields[idx].value;
        }
        if (doc.fields[idx].name == "Crew") {
          val['crew'] = doc.fields[idx].value;
        }
      }
    }
    emit([doc.report_id], val);
  }
}
