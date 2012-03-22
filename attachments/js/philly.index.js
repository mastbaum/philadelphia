/* philly index page */

/* load page elements */
$('#header').load('header.html');
$('#footer').load('footer.html');

$(document).ready(function() {
  phila.settings.db.list("phila/reports", "phila/reports", {
    success: function(data) {
      for (i in data) {
        var id = data[i].id;
        var summary = data[i].summary;
        var run = data[i].run;
        var crew = data[i].crew;
        var d = new Date(data[i].created);
        var created = phila.tools.date_string(d);
        html = '<tr>' +
          '<td>' +
          '<a href="view.html?id=' + id + '">' + (id ? id.substring(id.length-8, id.length) : 'error') + '</a></td>' +
          '<td style="white-space:nowrap;">' + created + '</td>' +
          '<td>' + run + '</td>' +
          '<td>' + summary + '</td>' +
          '<td>' + crew + '</td>' +
          '</tr>';
        $("tbody#reportlist_rows").append(html);
      }  
      $("#reportlist_table").tablesorter({sortList: [[1,1]]}); 
    }
  });
});

