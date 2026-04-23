import os
import sys

app_cache = None

def handler(environ, start_response):
    global app_cache
    if app_cache is None:
        try:
            import traceback
            # Directory setup
            current_dir = os.path.dirname(os.path.abspath(__file__))
            parent_dir = os.path.dirname(current_dir)
            erp_backend_dir = os.path.join(parent_dir, 'erp_backend')
            sys.path.insert(0, erp_backend_dir)

            # SQLite Vercel Workaround
            db_source = os.path.join(erp_backend_dir, 'db.sqlite3')
            db_tmp = '/tmp/db.sqlite3'
            if os.path.exists(db_source):
                import shutil
                if not os.path.exists(db_tmp):
                    shutil.copy2(db_source, db_tmp)
                os.environ['SQLITE_DB_PATH'] = db_tmp

            # Django setup
            os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
            from django.core.wsgi import get_wsgi_application
            app_cache = get_wsgi_application()
        except Exception as e:
            start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
            return [traceback.format_exc().encode('utf-8')]
            
    # Fix PATH_INFO if Vercel mangled it
    if environ.get('PATH_INFO', '').startswith('/api/index.py'):
        environ['PATH_INFO'] = environ['PATH_INFO'].replace('/api/index.py', '')
        
    return app_cache(environ, start_response)

app = handler
