import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Ensure PM and Employee demo accounts exist by renaming an existing one if needed
pm = User.objects.filter(role='project_manager').first()
if pm and not User.objects.filter(email='pm@kaizen.com').exists():
    pm.email = 'pm@kaizen.com'
    pm.save()

emp = User.objects.filter(role='employee').first()
if emp and not User.objects.filter(email='employee@kaizen.com').exists():
    emp.email = 'employee@kaizen.com'
    emp.save()

emails = [
    'ceo@kaizen.com', 
    'stakeholder@kaizen.com', 
    'hr@kaizen.com', 
    'pm@kaizen.com', 
    'employee@kaizen.com'
]

for email in emails:
    try:
        u = User.objects.get(email=email)
        u.set_password('password123')
        u.save()
        print(f"Reset password for {email} to 'password123'")
    except User.DoesNotExist:
        print(f"User {email} not found, skipping.")
