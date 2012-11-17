function(head, req) {
  var row;
  var rows = [];

  while (row = getRow()) {
    var doc = {
      created: 'invalid doc id',
      summary: 'invalid report id',
      run: 'invalid report id',
      crew: 'invalid report id',
      comments: 0,
      attchs: 0
    };

    for (var prop in row.value) {
      if (row.value.hasOwnProperty(prop)) {
        doc[prop] = row.value[prop];
      }
    }
    rows.push(doc);
  }
  return(JSON.stringify(rows));
}
