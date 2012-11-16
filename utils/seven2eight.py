#!/usr/bin/env python

# Convert Philadelphia documents from v0.7 to v0.8+
#
# Philadelphia: http://github.com/mastbaum/philadelphia
#
# A.Mastbaum <amastbaum@gmail.com>, Feb 2011
#

import sys
import re
import couchdb

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

def get_template_names(db):
    names = {}
    for row in db.view('phila/templates'):
        names[row.key[1]] = row.key[0]
    return names

if __name__ == '__main__':
    if len(sys.argv) == 2:
        print 'updating database', sys.argv[1], 'in place'
        source = get_db(sys.argv[1])
        target = source
    elif len(sys.argv) == 3:
        print 'converting old database', sys.argv[1], 'to new at', sys.argv[2]
        source = get_db(sys.argv[1])
        target = get_db(sys.argv[2])
    else:
        print 'Usage:', sys.argv[0], 'db_name [target]'
        sys.exit(1)

    template_names = get_template_names(source)

    for row in source.view('_all_docs', include_docs=True):
        doc = row.doc
        if doc['_id'][0] == '_':
            print 'skipping special/design doc', doc['_id']

        elif 'type' in doc and doc['type'] == 'subreport':
            if doc['report_id'] not in source:
                print 'skipping subreport with missing report', doc['_id']
                continue

            print 'updating', doc['_id']

            if 'subtype_name' in doc:
                template = doc['subtype_name']
            else:
                template = template_names[doc['subtype']]

            newdoc = {
                '_id': doc['_id'],
                '_rev': doc['_rev'],
                'report_id': doc['report_id'],
                'created': doc['created'],
                'name': template,
                'type': 'block',
                'fields': []}
            for key in doc:
                if key not in newdoc and key not in ['subtype', 'subtype_name']:
                    field = {
                        'name': key,
                        'value': doc[key],
                        'type': 'text'
                    }
                    newdoc['fields'].append(field)
            target.save(newdoc)
            print 'saved', doc['_id']

        else:
            target.save(doc)
            print 'saved', doc['_id']

