#!/usr/bin/env python

# Remove orphaned blocks (blocks with a non-existent report_id)
#
# Philadelphia: http://github.com/mastbaum/philadelphia
#
# A.Mastbaum <amastbaum@gmail.com>, Feb 2011
#

import sys
import re
import couchdb
from pprint import pprint

def get_db(url, create_target=True):
    match = re.match(r'((?P<protocol>.+):\/\/)?((?P<user>.+):(?P<pw>.+)?@)?(?P<url>.+)', url)
    if not match:
        print 'Error in URL string'
        sys.exit(1)
    host, dbname = match.group('url').split('/', 1)
    protocol = match.group('protocol')

    couch = couchdb.Server(protocol + '://' + host)

    if match.group('user'):
        couch.resource.credentials = (match.group('user'), match.group('pw'))

    try:
        db = couch[dbname]
    except couchdb.http.ResourceNotFound:
        if create_target:
            db = couch.create(dbname)
        else:
            raise

    return db

def get_report_ids(db):
    ids = []
    for row in db.view('_all_docs', include_docs=True):
        doc = row.doc
        if 'type' in doc:
            if doc['type'] == 'report':
                ids.append(doc['_id'])
    return ids

if __name__ == '__main__':
    if len(sys.argv) == 2:
        print 'updating database', sys.argv[1], 'in place'
        source = get_db(sys.argv[1])
        target = source
    elif len(sys.argv) == 3:
        print 'copying cleaned database', sys.argv[1], 'to new at', sys.argv[2]
        source = get_db(sys.argv[1])
        target = get_db(sys.argv[2])
    else:
        print 'Usage:', sys.argv[0], 'db_name [target]'
        sys.exit(1)

    ids = get_report_ids(source)
    print 'valid ids:', ids

    orphan_count = 0
    remove_count = 0

    for row in source.view('_all_docs', include_docs=True):
        doc = row.doc
        if not 'type' in doc:
            continue

        if doc['type'] == 'report':
            continue

        if (doc['type'] == 'block' or doc['type'] == 'subreport') and doc['report_id'] not in ids:
            print 'orphan:', doc['_id'], ', report', doc['report_id']
            orphan_count += 1
            pprint(doc)
            confirm = raw_input('delete y/(n)?: ')
            if confirm == 'y':
                print 'removed'
                remove_count += 1
                if source == target:
                    del source[doc['_id']]
            else:
                print 'kept'
                if source != target:
                    target.save(doc)

    print 'removed', remove_count, '/', orphan_count, 'orphans'

