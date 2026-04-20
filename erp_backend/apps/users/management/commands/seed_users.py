from django.core.management.base import BaseCommand
from apps.users.models import User
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seeds the database with demo users'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        users = [
            {'role': 'ceo', 'email': 'ceo@kaizen.com', 'password': 'password123', 'first_name': 'Rajesh', 'last_name': 'Mehta'},
            {'role': 'stakeholder', 'email': 'stakeholder@kaizen.com', 'password': 'password123', 'first_name': 'Vikram', 'last_name': 'Singhania'},
            {'role': 'hr', 'email': 'hr@kaizen.com', 'password': 'password123', 'first_name': 'Anjali', 'last_name': 'Sharma'},
            {'role': 'project_manager', 'email': 'pm@kaizen.com', 'password': 'password123', 'first_name': 'Suresh', 'last_name': 'Patel'},
            {'role': 'employee', 'email': 'employee@kaizen.com', 'password': 'password123', 'first_name': 'Rahul', 'last_name': 'Verma'},
        ]

        for user_data in users:
            email = user_data['email']
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email,
                    password=user_data['password'],
                    role=user_data['role'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
                self.stdout.write(self.style.SUCCESS(f'Created user {email}'))
            else:
                self.stdout.write(self.style.WARNING(f'User {email} already exists'))
