couchdb-lucene Design Document
==============================
The search feature of Philadelphia relies on [couchdb-lucene](https://github.com/rnewson/couchdb-lucene); `lucene.json` provides a design document that Lucene uses to index the field values in the Philadelphia database.

This may be integrated with the `phila` design document in the future, but for now push it separately e.g.

    $ egret pushdata http://localhost:5984/phila lucene.json

For details on actually setting up the Lucene server alongside Philadelphia, see [the documentation](http://philadelphia.rtfd.org).

*Implementation note:* Field names in couchdb-lucene cannot contain spaces or special characters, so for indexing these characters are converted to underscores.

