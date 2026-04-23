import os
import sys

# Add the erp_backend directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
erp_backend_dir = os.path.join(parent_dir, 'erp_backend')
sys.path.insert(0, erp_backend_dir)

# Vercel Read-Only Filesystem Workaround
# Copy the sqlite DB to the writable /tmp directory if we are running in Vercel
if os.environ.get('VERCEL'):
    import shutil
    db_source = os.path.join(erp_backend_dir, 'db.sqlite3')
    db_tmp = '/tmp/db.sqlite3'
    if not os.path.exists(db_tmp) and os.path.exists(db_source):
        shutil.copy2(db_source, db_tmp)
    os.environ['SQLITE_DB_PATH'] = db_tmp

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# Import the Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Vercel requires the variable to be named 'app'
app = application
