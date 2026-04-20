import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

try:
    cursor = connection.cursor()
    cursor.execute('SELECT 1')
    result = cursor.fetchone()
    print("✅ Database connection: SUCCESS")
    
    # Check if we can query users
    User = get_user_model()
    user_count = User.objects.count()
    print(f"✅ User table accessible: {user_count} users found")
    
except Exception as e:
    print(f"❌ Database connection FAILED: {e}")
