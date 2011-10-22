# example settings for philadelphia external programs
# edit as needed and move to settings.py

# couchdb server
db_host = 'http://localhost:5984'
db_name = 'phila'
view_url = 'http://localhost:5984/phila/_design/phila/view.html'

# couchdb user login information (read access)
db_user = 'username'
db_pass = 'password'

# smtp server used to send emails
smtp_server = 'localhost'

# list of addresses to notify when a report is submitted
notify_list = ['user@example.com']

