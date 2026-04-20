import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import Department, Designation
from apps.projects.models import Project, Task
from apps.clients.models import Client
from apps.hrm.models import LeaveRequest
from apps.finance.models import Invoice, Expense
from apps.assets.models import Asset
from apps.documents.models import Document

User = get_user_model()

print("KAIZEN ERM DATABASE")
print("=" * 50)
print(f"Users: {User.objects.count()}")
print(f"Departments: {Department.objects.count()}")
print(f"Projects: {Project.objects.count()}")
print(f"Tasks: {Task.objects.count()}")
print(f"Clients: {Client.objects.count()}")
print(f"Invoices: {Invoice.objects.count()}")
print(f"Expenses: {Expense.objects.count()}")
print(f"Assets: {Asset.objects.count()}")
print(f"Documents: {Document.objects.count()}")
print(f"Leave Requests: {LeaveRequest.objects.count()}")
print("=" * 50)
print("\nUSERS LIST:")
for u in User.objects.all():
    print(f"  - {u.email} ({u.role})")
print("\nDEPARTMENTS:")
for d in Department.objects.all():
    print(f"  - {d.name}")
print("\nPROJECTS:")
for p in Project.objects.all():
    print(f"  - {p.name} [{p.status}]")
print("\nCLIENTS:")
for c in Client.objects.all():
    print(f"  - {c.company_name}")
