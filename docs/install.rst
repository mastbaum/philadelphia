Installation
============
Philadelphia is a lightweight CouchDB application developed in the `egret framework <http://github.com/mastbaum/egret>`_. egret is a pure Python couch app development tool, and is included with Philadelphia for convenience.

Requirements
------------
* Python >= 2.6
* CouchDB >= 1.1.0

Installing
----------

Clone the Philadelphia repository from github::

    $ git clone git://github.com/mastbaum/philadelphia.git

If you wish, customize application settings in `settings.json`.

Then, from within the `philadelphia` directory, run::

    $ ./egret push http://your-server:port/database_name
    $ ./egret pushdata http://your-server:port/database_name templates.json

Your Philadelphia installation should now be live at `http://your-server:port/database_name/_design/designname/index.html`, where `designname` is that in `settings.json` (default: `phila`).

