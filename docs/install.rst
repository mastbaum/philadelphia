Installation
============
Philadelphia is a lightweight CouchDB application developed in the `egret framework <http://github.com/mastbaum/egret>`_. egret is a pure Python couch app development tool, and is included with Philadelphia for convenience.

Requirements
------------
* Python >= 2.6
* `CouchDB <http://couchdb.apache.org>`_ 1.1.0
* `couchdb-lucene <https://github.com/rnewson/couchdb-lucene>`_ 0.9

Installing
----------
Clone the Philadelphia repository from github::

    $ git clone git://github.com/mastbaum/philadelphia.git

If you wish, customize application settings in `settings.json` and templates in `templates.json`. 

Then, from within the `philadelphia` directory, run::

    $ ./egret push http://your-server:port/database_name
    $ ./egret pushdata http://your-server:port/database_name templates.json

Your Philadelphia installation should now be live at `http://your-server:port/database_name/_design/designname/index.html`, where `designname` is that in `settings.json` (default: `phila`).

Search Functionality
--------------------
The search feature of Philadelphia relies on `couchdb-lucene <https://github.com/rnewson/couchdb-lucene>`_, an external Java indexer.

To set up lucene:

1. Follow the instructions in the couchdb-lucene readme

    1. Download or git clone the couchdb-lucene source
    2. Build with ``mvn``. This will create a tarball in ``target/``
    3. Untar the tarball where the lucene server binary should live

2. If you are using CouchDB's HTTP authentication (i.e. you set ``require_valid_user=true`` in your CouchDB configuration), change the last lines of ``config/couchdb-lucene.ini`` to something like::

    [local]
    url = http://USERNAME:PASSWORD@localhost:5984

3. Start the lucene server with ``/PATH/TO/LUCENE/bin/run``. For production, this should be run as a daemon.
4. Add the following to the ``[httpd_global_handlers]`` section in CouchDB's ``local.ini`` and restart the CouchDB server::

    _fti = {couch_httpd_proxy, handle_proxy_req, <<"http://127.0.0.1:5985">>}

5. Push the lucene indexing design document to the Philadelphia database::

    $ egret pushdata http://localhost:5984/phila /PATH/TO/PHILA/lucene/lucene.json


Nice URLs
---------
URLs can easily be rewritten to be more user-friendly. For example, in Apache::

    ProxyRequests Off
    <Proxy *>
           Order Allow,Deny
           Allow from all
    </Proxy>

     RewriteEngine On
     RewriteOptions Inherit

     RewriteRule ^/_fti/(.+)$ http://127.0.0.1:5984/_fti/$1 [QSA,P]
     RewriteRule ^/_uuids(.*) http://127.0.0.1:5984/_uuids [QSA,P]
     RewriteRule ^/_utils/script/(.*) http://127.0.0.1:5984/_utils/script/$1 [QSA,P]

     RewriteRule ^/philadelphia$ /philadelphia/ [R]
     RewriteRule ^/philadelphia/$ http://[INSERT YOUR FQDN]/philadelphia/index.html?user=%{LA-U:REMOTE_USER} [QSA,P]

     RewriteRule ^/philadelphia/(.+)$ http://127.0.0.1:5984/phila/_design/phila/$1?user=%{LA-U:REMOTE_USER} [QSA,P]

     RewriteRule ^/phila/(.+)$ http://127.0.0.1:5984/phila/$1?user=%{LA-U:REMOTE_USER} [QSA,P]
     RewriteRule ^/phila/_changes(.+)$ http://127.0.0.1:5984/phila/_changes/$1?user=%{LA-U:REMOTE_USER} [QSA,P]
     RewriteRule ^/phila/(.*) http://127.0.0.1:5984/phila?user=%{LA-U:REMOTE_USER} [QSA,P]

This will put everything at ``http://server/philadelphia``.

There are only a few parameters that get passed around and it all happens via the query string, so even prettier URLs with no ``.html`` are possible too. Specifically, if ``edit.html`` receives an ``id`` it will open the report for editing (without an ``id`` it starts a new report), and ``results.html`` expects a search query ``q=key:value``.
