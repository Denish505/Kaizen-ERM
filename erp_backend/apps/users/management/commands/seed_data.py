"""
Django Management Command to seed the database with Indian sample data
Run: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Department, Designation
from apps.hrm.models import Employee, LeaveType, Salary
from datetime import date
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with Indian sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with Indian data...')

        # Create Departments
        departments_data = [
            {'name': 'Executive', 'code': 'EXEC', 'location': 'Mumbai', 'budget': 5000000},
            {'name': 'Human Resources', 'code': 'HR', 'location': 'Mumbai', 'budget': 2000000},
            {'name': 'Engineering', 'code': 'ENG', 'location': 'Bangalore', 'budget': 10000000},
            {'name': 'Design', 'code': 'DES', 'location': 'Bangalore', 'budget': 3000000},
            {'name': 'Project Management', 'code': 'PM', 'location': 'Mumbai', 'budget': 4000000},
            {'name': 'Sales', 'code': 'SALES', 'location': 'Delhi', 'budget': 5000000},
            {'name': 'Finance', 'code': 'FIN', 'location': 'Mumbai', 'budget': 2500000},
            {'name': 'Marketing', 'code': 'MKT', 'location': 'Delhi', 'budget': 3500000},
        ]

        departments = {}
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults=dept_data
            )
            departments[dept_data['code']] = dept
            if created:
                self.stdout.write(f'  Created department: {dept.name}')

        # Create Designations
        designations_data = [
            {'title': 'Chief Executive Officer', 'level': 8, 'department': 'EXEC', 'min_salary': 3000000, 'max_salary': 5000000},
            {'title': 'HR Manager', 'level': 5, 'department': 'HR', 'min_salary': 800000, 'max_salary': 1500000},
            {'title': 'Senior Project Manager', 'level': 6, 'department': 'PM', 'min_salary': 1200000, 'max_salary': 2000000},
            {'title': 'Project Manager', 'level': 5, 'department': 'PM', 'min_salary': 900000, 'max_salary': 1400000},
            {'title': 'Senior Developer', 'level': 4, 'department': 'ENG', 'min_salary': 1000000, 'max_salary': 1800000},
            {'title': 'Software Developer', 'level': 3, 'department': 'ENG', 'min_salary': 600000, 'max_salary': 1200000},
            {'title': 'UI/UX Designer', 'level': 3, 'department': 'DES', 'min_salary': 600000, 'max_salary': 1100000},
            {'title': 'Sales Executive', 'level': 3, 'department': 'SALES', 'min_salary': 500000, 'max_salary': 900000},
            {'title': 'Accountant', 'level': 3, 'department': 'FIN', 'min_salary': 500000, 'max_salary': 800000},
        ]

        designations = {}
        for des_data in designations_data:
            dept_code = des_data.pop('department')
            des, created = Designation.objects.get_or_create(
                title=des_data['title'],
                defaults={**des_data, 'department': departments.get(dept_code)}
            )
            designations[des_data['title']] = des
            if created:
                self.stdout.write(f'  Created designation: {des.title}')

        # Create Leave Types
        leave_types = [
            {'name': 'Casual Leave', 'code': 'CL', 'days_allowed': 12, 'is_paid': True, 'carry_forward': False},
            {'name': 'Sick Leave', 'code': 'SL', 'days_allowed': 12, 'is_paid': True, 'carry_forward': False},
            {'name': 'Earned Leave', 'code': 'EL', 'days_allowed': 15, 'is_paid': True, 'carry_forward': True},
            {'name': 'Maternity Leave', 'code': 'ML', 'days_allowed': 182, 'is_paid': True, 'carry_forward': False},
            {'name': 'Paternity Leave', 'code': 'PL', 'days_allowed': 15, 'is_paid': True, 'carry_forward': False},
            {'name': 'Work From Home', 'code': 'WFH', 'days_allowed': 52, 'is_paid': True, 'carry_forward': False},
        ]

        for lt_data in leave_types:
            lt, created = LeaveType.objects.get_or_create(code=lt_data['code'], defaults=lt_data)
            if created:
                self.stdout.write(f'  Created leave type: {lt.name}')

        # Create Users with Indian names
        users_data = [
            # CEO
            {
                'email': 'ceo@kaizen.com', 'password': 'ceo123', 'first_name': 'Rajesh', 'last_name': 'Sharma',
                'role': 'ceo', 'phone': '+91-9876543210', 'city': 'Mumbai', 'state': 'Maharashtra',
                'department': 'EXEC', 'designation': 'Chief Executive Officer', 'base_salary': 4200000,
                'pan_number': 'ABCPS1234K', 'joining_date': date(2020, 1, 15)
            },
            # Stakeholders
            {
                'email': 'stakeholder1@kaizen.com', 'password': 'stake123', 'first_name': 'Vikram', 'last_name': 'Mehta',
                'role': 'stakeholder', 'phone': '+91-9876543211', 'city': 'Mumbai', 'state': 'Maharashtra',
                'department': 'EXEC', 'designation': 'Chief Executive Officer', 'base_salary': 0,
                'joining_date': date(2019, 6, 1)
            },
            {
                'email': 'stakeholder2@kaizen.com', 'password': 'stake123', 'first_name': 'Priya', 'last_name': 'Agarwal',
                'role': 'stakeholder', 'phone': '+91-9876543212', 'city': 'Delhi', 'state': 'Delhi',
                'department': 'EXEC', 'designation': 'Chief Executive Officer', 'base_salary': 0,
                'joining_date': date(2019, 6, 1)
            },
            {
                'email': 'stakeholder3@kaizen.com', 'password': 'stake123', 'first_name': 'Suresh', 'last_name': 'Iyer',
                'role': 'stakeholder', 'phone': '+91-9876543213', 'city': 'Chennai', 'state': 'Tamil Nadu',
                'department': 'EXEC', 'designation': 'Chief Executive Officer', 'base_salary': 0,
                'joining_date': date(2019, 6, 1)
            },
            # HR Manager
            {
                'email': 'hr@kaizen.com', 'password': 'hr123', 'first_name': 'Anjali', 'last_name': 'Deshmukh',
                'role': 'hr', 'phone': '+91-9876543214', 'city': 'Mumbai', 'state': 'Maharashtra',
                'department': 'HR', 'designation': 'HR Manager', 'base_salary': 1200000,
                'pan_number': 'DEFGH5678J', 'joining_date': date(2021, 3, 1)
            },
            # Project Managers
            {
                'email': 'pm1@kaizen.com', 'password': 'pm123', 'first_name': 'Arjun', 'last_name': 'Nair',
                'role': 'project_manager', 'phone': '+91-9876543215', 'city': 'Bangalore', 'state': 'Karnataka',
                'department': 'PM', 'designation': 'Senior Project Manager', 'base_salary': 1800000,
                'pan_number': 'GHIJK9012L', 'joining_date': date(2020, 7, 15)
            },
            {
                'email': 'pm2@kaizen.com', 'password': 'pm123', 'first_name': 'Sneha', 'last_name': 'Kulkarni',
                'role': 'project_manager', 'phone': '+91-9876543216', 'city': 'Pune', 'state': 'Maharashtra',
                'department': 'PM', 'designation': 'Project Manager', 'base_salary': 1400000,
                'pan_number': 'JKLMN3456M', 'joining_date': date(2021, 5, 1)
            },
            # Employees
            {
                'email': 'amit@kaizen.com', 'password': 'emp123', 'first_name': 'Amit', 'last_name': 'Patel',
                'role': 'employee', 'phone': '+91-9876543217', 'city': 'Bangalore', 'state': 'Karnataka',
                'department': 'ENG', 'designation': 'Senior Developer', 'base_salary': 1500000,
                'pan_number': 'MNOPQ7890N', 'joining_date': date(2021, 8, 1)
            },
            {
                'email': 'pooja@kaizen.com', 'password': 'emp123', 'first_name': 'Pooja', 'last_name': 'Singh',
                'role': 'employee', 'phone': '+91-9876543218', 'city': 'Bangalore', 'state': 'Karnataka',
                'department': 'DES', 'designation': 'UI/UX Designer', 'base_salary': 900000,
                'pan_number': 'PQRST1234O', 'joining_date': date(2022, 1, 10)
            },
            {
                'email': 'rahul@kaizen.com', 'password': 'emp123', 'first_name': 'Rahul', 'last_name': 'Verma',
                'role': 'employee', 'phone': '+91-9876543219', 'city': 'Bangalore', 'state': 'Karnataka',
                'department': 'ENG', 'designation': 'Software Developer', 'base_salary': 1000000,
                'pan_number': 'RSTUV5678P', 'joining_date': date(2022, 4, 1)
            },
            {
                'email': 'neha@kaizen.com', 'password': 'emp123', 'first_name': 'Neha', 'last_name': 'Gupta',
                'role': 'employee', 'phone': '+91-9876543220', 'city': 'Mumbai', 'state': 'Maharashtra',
                'department': 'FIN', 'designation': 'Accountant', 'base_salary': 700000,
                'pan_number': 'TUVWX9012Q', 'joining_date': date(2021, 11, 1)
            },
            {
                'email': 'kiran@kaizen.com', 'password': 'emp123', 'first_name': 'Kiran', 'last_name': 'Reddy',
                'role': 'employee', 'phone': '+91-9876543221', 'city': 'Hyderabad', 'state': 'Telangana',
                'department': 'SALES', 'designation': 'Sales Executive', 'base_salary': 600000,
                'pan_number': 'VWXYZ3456R', 'joining_date': date(2022, 6, 1)
            },
        ]

        employee_count = 1
        for user_data in users_data:
            dept_code = user_data.pop('department', None)
            des_title = user_data.pop('designation', None)
            password = user_data.pop('password')

            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    **user_data,
                    'department': departments.get(dept_code),
                    'designation': designations.get(des_title),
                    'avatar': f"{user_data['first_name'][0]}{user_data['last_name'][0]}".upper()
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  Created user: {user.get_full_name()} ({user.role})')

                # Create Employee profile for non-stakeholders
                if user.role not in ['stakeholder']:
                    emp, emp_created = Employee.objects.get_or_create(
                        user=user,
                        defaults={
                            'employee_id': f'EMP{str(employee_count).zfill(3)}',
                            'employment_type': 'full_time',
                        }
                    )
                    if emp_created:
                        self.create_salary(emp, user.base_salary)
                    employee_count += 1

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))

    def create_salary(self, employee, annual_salary):
        """Create salary record for current month"""
        if annual_salary <= 0:
            return

        # Convert to Decimal for proper calculation
        annual_salary = Decimal(str(annual_salary))
        
        monthly_basic = annual_salary / Decimal('12')
        hra = monthly_basic * Decimal('0.40')  # 40% HRA
        da = monthly_basic * Decimal('0.10')   # 10% DA
        special = monthly_basic * Decimal('0.20')  # 20% Special

        gross = monthly_basic + hra + da + special

        # Deductions
        pf = min(monthly_basic * Decimal('0.12'), Decimal('1800'))  # 12% or max 1800
        esi = gross * Decimal('0.0075') if gross <= Decimal('21000') else Decimal('0')  # 0.75% if gross <= 21000
        pt = Decimal('200')  # Professional Tax

        # TDS calculation (simplified)
        annual_taxable = annual_salary - Decimal('250000')  # Standard deduction
        if annual_taxable > Decimal('1000000'):
            tds = (annual_taxable * Decimal('0.30')) / Decimal('12')
        elif annual_taxable > Decimal('500000'):
            tds = (annual_taxable * Decimal('0.20')) / Decimal('12')
        elif annual_taxable > Decimal('0'):
            tds = (annual_taxable * Decimal('0.05')) / Decimal('12')
        else:
            tds = Decimal('0')

        total_deductions = pf + esi + pt + tds
        net_salary = gross - total_deductions

        Salary.objects.create(
            employee=employee,
            month=1,
            year=2026,
            basic_salary=monthly_basic,
            hra=hra,
            da=da,
            special_allowance=special,
            pf_employee=pf,
            pf_employer=pf,
            esi_employee=esi,
            esi_employer=esi * Decimal('4.33'),
            professional_tax=pt,
            tds=tds,
            gross_salary=gross,
            total_deductions=total_deductions,
            net_salary=net_salary,
            payment_status='paid',
            payment_date=date(2026, 1, 31)
        )
