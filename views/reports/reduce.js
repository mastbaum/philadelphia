function(keys, values, rereduce) {
  var val = {};
  var attchs = 0;
  for (var idx=0; idx < values.length; idx++) {
    for (var prop in values[idx]) {
      if (values[idx].hasOwnProperty(prop)) {
        if (prop=="attchs") {
          attchs = attchs + values[idx][prop];
        }
        else {
          val[prop] = values[idx][prop];
        }
      }
    }
  }
  val['attchs'] = attchs;

  return val;
}
