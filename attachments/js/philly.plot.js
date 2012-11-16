/* philly plotting */

/* load page elements */
$('#header').load('header.html');
$('#footer').load('footer.html');

/* event handlers */
// scatter plot
$("button#makeplot_scatter").live('click', function(event) {
  event.preventDefault();
  field_x = $("input#xval_scatter").val();
  field_y = $("input#yval_scatter").val();

  var d = {};

  phila.settings.db.view('phila/all_keys', {
    startkey: [field_x],
    endkey: [field_x, {}],
    success: function(data) {
      for (idx in data.rows) {
        d[data.rows[idx].value.report_id] = {x: parseFloat(data.rows[idx].value.value), y: null};
      }
      phila.settings.db.view('phila/all_keys', {
        startkey: [field_y],
        endkey: [field_y, {}],
        success: function(data) {
          for (idx in data.rows) {
            d[data.rows[idx].value.report_id].y = parseFloat(data.rows[idx].value.value);
          }

          var nans = false;
          var plot_data = [];

          for (idx in d) {
            if (!(d[idx].x && d[idx].y)) {
              if ((d[idx].x && isNaN(d[idx].y)) || (d[idx].y && isNaN(d[idx].x))) {
                nans = true;
              }
            }
            else {
              plot_data.push([d[idx].x, d[idx].y]);
            }
          }

          if (nans) {
            $("#scatter_alert").fadeIn('slow');
          }
          else {
            $("#scatter_alert").fadeOut('slow');
          }

          $.plot($("#plot_scatter"), [plot_data], {lines: {show: false}, points: {show: true}});
        },
        error: function(err) {
          //console.log('error: ' + err);
        }
      });
    },
    error: function(err) {
      //console.log('error: ' + err);
    }
  });
});

// time series
$("button#makeplot_timeseries").live('click', function(event) {
  event.preventDefault();
  var key = $("input#yval_timeseries").val();
  var vals = [];

  phila.settings.db.view('phila/all_keys', {
    startkey: [key],
    endkey: [key, {}],
    success: function(data) {
      $("#timeseries_alert").fadeOut('slow');
      var nans = false;

      for (i in data.rows) {
        //console.log(data.rows[i]);
        var val = parseFloat(data.rows[i].value.value);
        if (!isNaN(val)) {
          var time = Date.parse(data.rows[i].key[1]);
          vals.push([time, val]);
        }
        else {
          nans = true;
          $("#timeseries_alert").fadeIn('slow');
        }
      }

      //console.log(vals)
      $.plot($("#plot_timeseries"), [vals], {xaxis: {mode: "time"}, lines: {show: false}, points: {show: true}});
    },
    error: function(err) {
      //console.log('error: ' + err);
    }
  });
});

// histogram
$("button#makeplot_histogram").live('click', function(event) {
  event.preventDefault();
  var key = $("input#series_histogram").val();
  var nbins = $("input#nbins_histogram").val();
  var vals = [];

  phila.settings.db.view('phila/all_keys', {
    startkey: [key],
    endkey: [key, {}],
    success: function(data) {
      var nans = false;
      for (i in data.rows) {
        var val = parseFloat(data.rows[i].value.value);

        if (!isNaN(val)) {
          var time = Date.parse(data.rows[i].key[1]);
          vals.push(val);
        }
        else {
          nans = true;
        }
      }
      if (nans) {
        $("#histogram_alert").fadeIn('slow');
      }
      else {
        $("#histogram_alert").fadeOut('slow');
      }

      var hist = phila.plot.histogram(vals, nbins);

      var min = Math.min.apply(Math, vals);
      var max = Math.max.apply(Math, vals);
      var width = (max - min + 1) / nbins;

      $.plot($("#plot_histogram"), [hist], {
        series: {
          stack: 0,
          lines: { show: false, fill: true, steps: false },
          bars: { show: true, barWidth: width }
        }
      });

    },
    error: function(err) {
      //console.log('error: ' + err);
    }
  });
});

$(document).ready(function() {
  phila.tools.load_autocomplete_keys('input.autokeys');
});

