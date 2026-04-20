import os
import django
import datetime
import random
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.finance.models import Invoice, Expense
from apps.projects.models import Project, Task
from apps.clients.models import Client

def generate_april_data():
    today = datetime.date.today()
    
    # 1. Add some invoices for April
    clients = list(Client.objects.all())
    for i in range(3):
        client = random.choice(clients)
        project = Project.objects.filter(client=client).first()
        issue = today - datetime.timedelta(days=random.randint(1, 5))
        due = today + datetime.timedelta(days=15)
        
        Invoice.objects.create(
            invoice_number=f"INV-APR-{random.randint(1000, 9999)}",
            client=client,
            project=project,
            issue_date=issue,
            due_date=due,
            subtotal=500000 + (i * 100000),
            total=590000 + (i * 118000),
            status='paid',
        )

    # 2. Add some expenses for April
    from django.contrib.auth import get_user_model
    User = get_user_model()
    emp_user = User.objects.filter(role='employee').first()
    
    if emp_user:
        Expense.objects.create(
            title="April Software Subscriptions",
            category="software",
            amount=75000,
            date=today - datetime.timedelta(days=2),
            submitted_by=emp_user,
            status='approved'
        )
        Expense.objects.create(
            title="Server Costs April",
            category="hardware",
            amount=120000,
            date=today - datetime.timedelta(days=1),
            submitted_by=emp_user,
            status='approved'
        )

    print("April 2026 demo data generated successfully!")

if __name__ == "__main__":
    generate_april_data()
