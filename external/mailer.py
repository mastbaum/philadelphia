#!/usr/bin/env python

# mailer.py
#
# This script sends out email notifications for completed Philadelphia
# shift reports. It should be run as a daemon by CouchDB via the
# os_daemons directive in local.ini.
#
# Andy Mastbaum (amastbaum@gmail.com), 2011
#

import sys
import types
import getpass
import socket
import smtplib
import couchdb

import settings

def get_submitted(db):
    '''more persistent wrapper for couchdb changes. the couchdb package
    nicely provides the changes feed as a generator, but it terminates
    after some time inactive. since the changes feed drives the dirt
    event loop, we have to wrap the changes in a generator that will
    never die.
    '''
    while(True):
        last_seq = 0
        changes = db.changes(feed='continuous', since=last_seq, filter='phila/submitted')
        for change in changes:
            try:
                id = change['id']
                yield id
                #if not db[id].has_key('emailed'):
                #    yield id
            except KeyError:
                try:
                    # sometimes the feed terminates, but tells us the last seq
                    last_seq = change['last_seq']
                except KeyError:
                    continue
            except couchdb.http.ResourceNotFound:
                # sometimes this happens when the feed terminates
                continue

def email(recipients, subject, message, sender=None):
    '''sends an email via smtp'''
    if settings.smtp_server == '':
        print 'No SMTP server defined, unable to send email'
        return
    if type(recipients) is not types.ListType:
        recipients = [recipients]
    if not sender:
        username = getpass.getuser()
        hostname = socket.gethostname()
        sender = '%s@%s' % (username, hostname)
    message = ('Subject: %s' % subject) + '\n\n' + message
    try:
        smtp = smtplib.SMTP(settings.smtp_server)
        smtp.sendmail(sender, recipients, message)
    except smtplib.SMTPException:
        print 'yelling: email: Failed to send message'
        raise

if __name__ == '__main__':
    if settings.smtp_server == '':
        print 'mailer: No SMTP server defined'
        sys.exit(1)

    # connect to db
    couch = couchdb.Server(settings.db_host)
    try:
        try:
            couch.resource.credentials = (settings.db_user, settings.db_pass)
        except NameError:
            pass
        if couch.version() < '1.1.0':
            print('mailer: couchdb version >= 1.1.0 required')
            sys.exit(1)
        db = couch[settings.db_name]
    except Exception:
        print 'mailer: Error connecting to database'
        raise
        sys.exit(1)

    # send email as reports roll in
    submitted_reports = get_submitted(db)
    for id in submitted_reports:
        report = db.view('phila/report', None, startkey=[id], endkey=[id,{}]).rows
        for row in report:
            doc = row.value
            if doc.has_key('subtype') and doc['subtype'] == 'basic_template':
                subject = '[philadelphia] Shift Report ' + doc['_id'][-8:]
                message_data = {'created': doc['created'], 'run': doc['Run number'], 'crew': doc['Crew'], 'summary': doc['Summary'], 'id': doc['report_id'], 'host': settings.db_host, 'dbname': settings.db_name, 'view_url': settings.view_url}
                message = '''A new shift report has been posted on Philadelphia:\n\nCreated: %(created)s\nRun number: %(run)s\nCrew: %(crew)s\nSummary: %(summary)s\nReport ID: %(id)s\n\nView report: %(view_url)s?id=%(id)s\n\nSent by the Philadelphia database at %(host)s/%(dbname)s''' % message_data

                email(settings.notify_list, subject, message)

