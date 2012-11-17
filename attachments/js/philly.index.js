/* philly index page */

/* load page elements */
$('#header').load('header.html');
$('#footer').load('footer.html');

$(document).ready(function() {
  phila.settings.db.list("phila/reports", "phila/reports", {
    group: true,
    success: function(data) {
      for (i in data) {
        var id = data[i].id;
        var summary = data[i].summary;
        var run = data[i].run;
        var crew = data[i].crew;
        var d = new Date(data[i].created);
        var created = phila.tools.date_string(d);
        var comments = data[i].comments;
        var attchs = data[i].attchs;
        html = '<tr class="report-row" style="cursor:pointer" id="' + id + '">' +
          '<td>' +
          '<a href="view.html?id=' + id + '">' + (id ? id.substring(id.length-8, id.length) : 'error') + '</a></td>' +
          '<td style="white-space:nowrap;">' + created + '</td>' +
          '<td>' + run + '</td>' +
          '<td>' + summary +
            '<ul class=sticker>' +
            (comments > 0 ? '<li><img style="margin-top:1px" src="images/comment.png"/><span>' + comments + '</span></li>' : '') +
            (attchs > 0 ? '<li><img src="images/paper_clip.png"/><span>' + attchs + '</span></li>' : '') +
            '</ul>' +
          '</td>' +
          '<td>' + crew + '</td>' +
          '</tr>';
        $("tbody#reportlist_rows").append(html);
      }  
      $("#reportlist_table").tablesorter({sortList: [[1,1]]});
      $("tr.report-row").live('click', function(e) {
        window.location.href = 'view.html?id=' + $(this).attr('id');
      });
    }
  });
});

