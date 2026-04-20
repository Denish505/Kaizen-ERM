import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User
from apps.hrm.models import Employee, Salary
from apps.clients.models import Client, Lead
from apps.projects.models import Project
from apps.finance.models import Invoice, Expense

print("\n" + "="*60)
print("DATABASE STATUS CHECK")
print("="*60)
print(f"\nEmployees: {Employee.objects.count()}")
print(f"Clients: {Client.objects.count()}")
print(f"Leads: {Lead.objects.count()}")
print(f"Projects: {Project.objects.count()}")
print(f"Invoices: {Invoice.objects.count()}")
print(f"Expenses: {Expense.objects.count()}")
print(f"Salaries: {Salary.objects.count()}")
print("\n" + "="*60)
