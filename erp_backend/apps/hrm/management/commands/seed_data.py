"""
Django management command to populate database with sample data
for Kaizen ERM - includes employees, departments, salaries, projects, etc.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample data for all modules'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')
        
        # Import models
        from apps.hrm.models import Department, Employee, LeaveRequest, Attendance
        from apps.projects.models import Project, ProjectMember, Task, Timesheet
        from apps.clients.models import Client, Contact, Deal, Contract
        from apps.finance.models import Invoice, InvoiceItem, Payment, Expense
        
        # Create Departments
        self.stdout.write('Creating departments...')
        departments_data = [
            {'name': 'Engineering', 'code': 'ENG', 'description': 'Software Development and Engineering'},
            {'name': 'Human Resources', 'code': 'HR', 'description': 'Human Resource Management'},
            {'name': 'Finance', 'code': 'FIN', 'description': 'Financial Operations'},
            {'name': 'Sales', 'code': 'SAL', 'description': 'Sales and Business Development'},
            {'name': 'Marketing', 'code': 'MKT', 'description': 'Marketing and Communications'},
            {'name': 'Operations', 'code': 'OPS', 'description': 'Operations Management'},
            {'name': 'Product', 'code': 'PRD', 'description': 'Product Management'},
        ]
        
        departments = {}
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults=dept_data
            )
            departments[dept_data['code']] = dept
            if created:
                self.stdout.write(f'  Created: {dept.name}')

        # Create Employees with realistic Indian names
        self.stdout.write('\nCreating employees...')
        employees_data = [
            {'first_name': 'Arjun', 'last_name': 'Sharma', 'email': 'arjun.sharma@kaizen.com', 'department': 'ENG', 'designation': 'Senior Software Engineer', 'salary': 1500000},
            {'first_name': 'Priya', 'last_name': 'Patel', 'email': 'priya.patel@kaizen.com', 'department': 'HR', 'designation': 'HR Manager', 'salary': 1200000},
            {'first_name': 'Vikram', 'last_name': 'Singh', 'email': 'vikram.singh@kaizen.com', 'department': 'FIN', 'designation': 'Finance Manager', 'salary': 1400000},
            {'first_name': 'Ananya', 'last_name': 'Reddy', 'email': 'ananya.reddy@kaizen.com', 'department': 'SAL', 'designation': 'Sales Lead', 'salary': 1100000},
            {'first_name': 'Rahul', 'last_name': 'Kumar', 'email': 'rahul.kumar@kaizen.com', 'department': 'ENG', 'designation': 'Full Stack Developer', 'salary': 1000000},
            {'first_name': 'Sneha', 'last_name': 'Iyer', 'email': 'sneha.iyer@kaizen.com', 'department': 'MKT', 'designation': 'Marketing Manager', 'salary': 1100000},
            {'first_name': 'Amit', 'last_name': 'Gupta', 'email': 'amit.gupta@kaizen.com', 'department': 'ENG', 'designation': 'DevOps Engineer', 'salary': 1200000},
            {'first_name': 'Kavitha', 'last_name': 'Nair', 'email': 'kavitha.nair@kaizen.com', 'department': 'PRD', 'designation': 'Product Manager', 'salary': 1350000},
            {'first_name': 'Suresh', 'last_name': 'Menon', 'email': 'suresh.menon@kaizen.com', 'department': 'OPS', 'designation': 'Operations Head', 'salary': 1300000},
            {'first_name': 'Meera', 'last_name': 'Joshi', 'email': 'meera.joshi@kaizen.com', 'department': 'ENG', 'designation': 'QA Lead', 'salary': 950000},
            {'first_name': 'Rajesh', 'last_name': 'Verma', 'email': 'rajesh.verma@kaizen.com', 'department': 'SAL', 'designation': 'Account Manager', 'salary': 900000},
            {'first_name': 'Deepika', 'last_name': 'Rao', 'email': 'deepika.rao@kaizen.com', 'department': 'HR', 'designation': 'HR Executive', 'salary': 700000},
            {'first_name': 'Karthik', 'last_name': 'Subramanian', 'email': 'karthik.s@kaizen.com', 'department': 'ENG', 'designation': 'Backend Developer', 'salary': 850000},
            {'first_name': 'Lakshmi', 'last_name': 'Krishnan', 'email': 'lakshmi.k@kaizen.com', 'department': 'FIN', 'designation': 'Accountant', 'salary': 650000},
            {'first_name': 'Aditya', 'last_name': 'Bhatt', 'email': 'aditya.bhatt@kaizen.com', 'department': 'ENG', 'designation': 'Frontend Developer', 'salary': 800000},
        ]
        
        employees = []
        for emp_data in employees_data:
            dept = departments.get(emp_data.pop('department'))
            emp, created = Employee.objects.get_or_create(
                email=emp_data['email'],
                defaults={
                    **emp_data,
                    'department': dept,
                    'phone': f'+91 98{random.randint(10000000, 99999999)}',
                    'hire_date': date.today() - timedelta(days=random.randint(30, 1095)),
                    'status': 'active',
                    'employee_type': 'full_time',
                }
            )
            employees.append(emp)
            if created:
                self.stdout.write(f'  Created: {emp.first_name} {emp.last_name}')

        # Create Clients
        self.stdout.write('\nCreating clients...')
        clients_data = [
            {'name': 'Rohit Mehta', 'company_name': 'TechCorp India Pvt Ltd', 'email': 'rohit@techcorp.in', 'industry': 'IT Services', 'city': 'Mumbai', 'state': 'Maharashtra', 'total_revenue': 5000000},
            {'name': 'Sunita Agarwal', 'company_name': 'Finserve Solutions', 'email': 'sunita@finserve.com', 'industry': 'Banking', 'city': 'Delhi', 'state': 'Delhi', 'total_revenue': 3500000},
            {'name': 'Manoj Pillai', 'company_name': 'RetailMax India', 'email': 'manoj@retailmax.in', 'industry': 'Retail', 'city': 'Bangalore', 'state': 'Karnataka', 'total_revenue': 2800000},
            {'name': 'Nisha Chandra', 'company_name': 'HealthFirst Hospitals', 'email': 'nisha@healthfirst.in', 'industry': 'Healthcare', 'city': 'Chennai', 'state': 'Tamil Nadu', 'total_revenue': 4200000},
            {'name': 'Gaurav Saxena', 'company_name': 'AutoDrive Motors', 'email': 'gaurav@autodrive.com', 'industry': 'Manufacturing', 'city': 'Pune', 'state': 'Maharashtra', 'total_revenue': 6100000},
            {'name': 'Pallavi Deshmukh', 'company_name': 'EduLearn Academy', 'email': 'pallavi@edulearn.in', 'industry': 'Education', 'city': 'Hyderabad', 'state': 'Telangana', 'total_revenue': 1800000},
        ]
        
        clients = []
        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                email=client_data['email'],
                defaults={
                    **client_data,
                    'phone': f'+91 98{random.randint(10000000, 99999999)}',
                    'gstin': f'{random.randint(10,99)}AAA{random.choice(["A","B","C"])}{random.choice(["A","B","C"])}{random.randint(1000,9999)}{random.choice(["A","B","C"])}{random.choice(["1","2","3"])}Z{random.choice(["A","B","C"])}',
                    'status': 'active',
                }
            )
            clients.append(client)
            if created:
                self.stdout.write(f'  Created: {client.company_name}')

        # Create Projects
        self.stdout.write('\nCreating projects...')
        projects_data = [
            {'name': 'ERP System Modernization', 'code': 'PRJ-001', 'client': 0, 'status': 'in_progress', 'priority': 'high', 'budget': 2500000, 'progress': 65},
            {'name': 'Mobile Banking App', 'code': 'PRJ-002', 'client': 1, 'status': 'in_progress', 'priority': 'urgent', 'budget': 1800000, 'progress': 40},
            {'name': 'E-commerce Platform', 'code': 'PRJ-003', 'client': 2, 'status': 'planning', 'priority': 'medium', 'budget': 1200000, 'progress': 10},
            {'name': 'Hospital Management System', 'code': 'PRJ-004', 'client': 3, 'status': 'in_progress', 'priority': 'high', 'budget': 3200000, 'progress': 55},
            {'name': 'Fleet Management IoT', 'code': 'PRJ-005', 'client': 4, 'status': 'completed', 'priority': 'medium', 'budget': 2000000, 'progress': 100},
            {'name': 'Learning Management System', 'code': 'PRJ-006', 'client': 5, 'status': 'in_progress', 'priority': 'low', 'budget': 800000, 'progress': 80},
        ]
        
        projects = []
        for proj_data in projects_data:
            client_idx = proj_data.pop('client')
            progress = proj_data.pop('progress')
            proj, created = Project.objects.get_or_create(
                code=proj_data['code'],
                defaults={
                    **proj_data,
                    'client': clients[client_idx] if client_idx < len(clients) else None,
                    'description': f"Comprehensive project for {clients[client_idx].company_name if client_idx < len(clients) else 'Internal'}",
                    'start_date': date.today() - timedelta(days=random.randint(30, 180)),
                    'end_date': date.today() + timedelta(days=random.randint(30, 180)),
                }
            )
            # Update progress field
            if hasattr(proj, 'progress'):
                proj.progress = progress
                proj.save()
            projects.append(proj)
            if created:
                self.stdout.write(f'  Created: {proj.name}')

        # Create Invoices
        self.stdout.write('\nCreating invoices...')
        for i, client in enumerate(clients[:4]):
            amount = Decimal(random.randint(100000, 500000))
            invoice, created = Invoice.objects.get_or_create(
                invoice_number=f'INV-2026-{str(i+1).zfill(4)}',
                defaults={
                    'client': client,
                    'issue_date': date.today() - timedelta(days=random.randint(10, 45)),
                    'due_date': date.today() + timedelta(days=random.randint(15, 45)),
                    'subtotal': amount,
                    'tax_amount': amount * Decimal('0.18'),
                    'total': amount * Decimal('1.18'),
                    'balance_due': amount * Decimal('1.18') * Decimal(random.choice(['0', '0.5', '1'])),
                    'status': random.choice(['sent', 'paid', 'partially_paid', 'overdue']),
                }
            )
            if created:
                # Create invoice items
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f'Professional Services for {projects[i].name if i < len(projects) else "Consulting"}',
                    quantity=1,
                    unit_price=amount,
                    amount=amount
                )
                self.stdout.write(f'  Created: {invoice.invoice_number}')

        # Create Expenses
        self.stdout.write('\nCreating expenses...')
        expense_categories = ['Software Licenses', 'Office Supplies', 'Travel', 'Marketing', 'Training', 'Equipment']
        for i in range(8):
            Expense.objects.get_or_create(
                description=f'{random.choice(expense_categories)} - {date.today().strftime("%B %Y")}',
                defaults={
                    'amount': Decimal(random.randint(5000, 100000)),
                    'category': random.choice(['operations', 'marketing', 'travel', 'utilities', 'software', 'other']),
                    'expense_date': date.today() - timedelta(days=random.randint(1, 60)),
                    'status': random.choice(['approved', 'pending', 'approved']),
                    'vendor': random.choice(['Amazon Business', 'Flipkart', 'Google Cloud', 'AWS', 'Microsoft', 'Adobe']),
                }
            )
        self.stdout.write('  Created expenses')

        # Summary
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(f'  - Departments: {Department.objects.count()}')
        self.stdout.write(f'  - Employees: {Employee.objects.count()}')
        self.stdout.write(f'  - Clients: {Client.objects.count()}')
        self.stdout.write(f'  - Projects: {Project.objects.count()}')
        self.stdout.write(f'  - Invoices: {Invoice.objects.count()}')
