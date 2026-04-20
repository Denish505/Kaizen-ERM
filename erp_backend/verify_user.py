import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = 'ceo@kaizen.com'
try:
    u = User.objects.get(email=email)
    print(f"User {email}: Active={u.is_active}, Role={u.role}, PasswordHash={u.password[:10]}...")
    if u.check_password('password123'):
        print("Password check: SUCCESS")
    else:
        print("Password check: FAILED")
except User.DoesNotExist:
    print(f"User {email} NOT FOUND")
