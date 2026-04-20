import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User

for u in User.objects.all().order_by('role', 'first_name'):
    print(u.first_name, u.last_name, "-", u.email, "-", u.role)
