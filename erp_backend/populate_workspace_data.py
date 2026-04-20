"""
Kaizen ERM — Workspace & Resources Data Populate Script
========================================================
Populates:
  ✅ Attendance records (last 60 days per employee)
  ✅ Leave Types
  ✅ Leave Requests (approved, pending, rejected)
  ✅ Performance Reviews with ratings per employee
  ✅ Holidays (Indian national + regional public holidays)
  ✅ Asset Categories + Assets (laptops, phones, furniture, etc.)
  ✅ Software Licenses + Assignments
  ✅ Document Folders (without physical files)
  ✅ Tasks assigned to employees (if missing)
  ✅ Salary records extended to 6 months
"""

import os
import django
import random
from datetime import date, timedelta, time
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Department
from apps.hrm.models import (
    Employee, Attendance, LeaveType, LeaveRequest,
    Salary, Holiday, PerformanceReview
)
from apps.assets.models import Asset, AssetCategory, AssetMaintenance, SoftwareLicense, LicenseAssignment
from apps.documents.models import DocumentFolder
from apps.projects.models import Project, Task

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_all_employees():
    return list(Employee.objects.select_related('user', 'user__department', 'user__designation').all())

def get_all_users():
    return list(User.objects.filter(is_active=True))

def get_managers():
    return list(User.objects.filter(role__in=['ceo', 'hr', 'project_manager']))

def is_weekday(d):
    return d.weekday() < 5  # Mon–Fri


# ─────────────────────────────────────────────────────────────────────────────
# 1. Attendance Records
# ─────────────────────────────────────────────────────────────────────────────

def create_attendance():
    print("\n⏰ Creating Attendance Records...")
    employees = get_all_employees()
    today = date.today()
    count = 0

    for employee in employees:
        # Generate last 60 working days
        for days_ago in range(1, 61):
            day = today - timedelta(days=days_ago)
            if not is_weekday(day):
                continue
            if Attendance.objects.filter(employee=employee, date=day).exists():
                continue

            # 80% present, 10% late, 5% absent, 5% WFH
            r = random.random()
            if r < 0.80:
                status = 'present'
            elif r < 0.90:
                status = 'late'
            elif r < 0.95:
                status = 'absent'
            else:
                status = 'wfh'

            if status in ('present', 'wfh'):
                check_in = time(random.randint(8, 9), random.randint(0, 59))
                check_out = time(random.randint(17, 19), random.randint(0, 59))
                hours = round(
                    ((check_out.hour * 60 + check_out.minute) - (check_in.hour * 60 + check_in.minute)) / 60, 2
                )
            elif status == 'late':
                check_in = time(random.randint(10, 11), random.randint(0, 59))
                check_out = time(random.randint(18, 20), random.randint(0, 59))
                hours = round(
                    ((check_out.hour * 60 + check_out.minute) - (check_in.hour * 60 + check_in.minute)) / 60, 2
                )
            else:
                check_in = None
                check_out = None
                hours = Decimal('0')

            Attendance.objects.create(
                employee=employee,
                date=day,
                check_in=check_in,
                check_out=check_out,
                status=status,
                hours_worked=hours if hours else Decimal('0'),
            )
            count += 1

    print(f"  ✅ Created {count} attendance records")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Leave Types
# ─────────────────────────────────────────────────────────────────────────────

LEAVE_TYPES_DATA = [
    {'name': 'Casual Leave', 'code': 'CL', 'days_allowed': 12, 'is_paid': True, 'carry_forward': False,
     'description': 'For personal or casual purposes'},
    {'name': 'Sick Leave', 'code': 'SL', 'days_allowed': 12, 'is_paid': True, 'carry_forward': False,
     'description': 'For illness or medical appointments'},
    {'name': 'Earned Leave', 'code': 'EL', 'days_allowed': 15, 'is_paid': True, 'carry_forward': True,
     'description': 'Accumulated earned leave that can carry forward'},
    {'name': 'Maternity Leave', 'code': 'ML', 'days_allowed': 182, 'is_paid': True, 'carry_forward': False,
     'description': 'Maternity benefit as per Indian law'},
    {'name': 'Paternity Leave', 'code': 'PL', 'days_allowed': 15, 'is_paid': True, 'carry_forward': False,
     'description': 'For new fathers'},
    {'name': 'Compensatory Off', 'code': 'CO', 'days_allowed': 10, 'is_paid': True, 'carry_forward': False,
     'description': 'Compensation for working on holidays or weekends'},
    {'name': 'Loss of Pay', 'code': 'LOP', 'days_allowed': 0, 'is_paid': False, 'carry_forward': False,
     'description': 'Leave without pay'},
]

def create_leave_types():
    print("\n📋 Creating Leave Types...")
    for lt_data in LEAVE_TYPES_DATA:
        if not LeaveType.objects.filter(code=lt_data['code']).exists():
            LeaveType.objects.create(**lt_data)
            print(f"  ✅ Created leave type: {lt_data['name']}")
    return list(LeaveType.objects.all())


# ─────────────────────────────────────────────────────────────────────────────
# 3. Leave Requests
# ─────────────────────────────────────────────────────────────────────────────

def create_leave_requests(leave_types):
    print("\n🌴 Creating Leave Requests...")
    employees = get_all_employees()
    managers = get_managers()
    count = 0

    if not leave_types:
        print("  ⚠️  No leave types found — skipping")
        return

    today = date.today()

    reasons = [
        'Personal work', 'Medical appointment', 'Family function',
        'Travel', 'Home renovation', 'Health checkup', 'Festival celebration',
        'Child school event', 'Urgent family matter', 'Medical procedure',
    ]

    for employee in employees:
        # 2–4 leave requests per employee
        for _ in range(random.randint(2, 4)):
            lt = random.choice(leave_types)
            days_offset = random.randint(-60, 30)
            start = today + timedelta(days=days_offset)
            duration = random.randint(1, 3)
            end = start + timedelta(days=duration - 1)

            if LeaveRequest.objects.filter(employee=employee, start_date=start).exists():
                continue

            status = random.choice(['approved', 'approved', 'approved', 'pending', 'rejected'])
            approved_by = random.choice(managers) if status in ('approved', 'rejected') and managers else None
            from django.utils import timezone as tz
            approved_on = tz.now() if approved_by else None

            LeaveRequest.objects.create(
                employee=employee,
                leave_type=lt,
                start_date=start,
                end_date=end,
                days=duration,
                reason=random.choice(reasons),
                status=status,
                approved_by=approved_by,
                approved_on=approved_on,
                rejection_reason='Insufficient leave balance' if status == 'rejected' else '',
            )
            count += 1

    print(f"  ✅ Created {count} leave requests")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Performance Reviews
# ─────────────────────────────────────────────────────────────────────────────

REVIEW_FEEDBACK = [
    "Consistently delivers high-quality work on time. Excellent communication skills and a great team player.",
    "Shows strong problem-solving abilities. Could improve on documentation and knowledge sharing.",
    "Outstanding performance this quarter. Took initiative on multiple projects and mentored junior team members.",
    "Good technical skills but needs to improve on meeting deadlines. Has shown improvement since last review.",
    "Excellent client management skills. Strong analytical thinking and proactive approach to challenges.",
    "Demonstrates solid understanding of the domain. Needs to work on improving cross-functional collaboration.",
    "Exceeded all targets this quarter. Leadership qualities are evident — ready for next level responsibilities.",
    "Good performer with room for growth. Recommended for advanced training in cloud technologies.",
]

REVIEW_GOALS_TEMPLATES = [
    "Complete AWS certification\nLead at least one client presentation\nMentor 2 junior developers",
    "Improve code review participation\nTarget 95% sprint completion rate\nDocument all processes",
    "Lead one major module delivery\nImprove client satisfaction score\nComplete PMP certification",
    "Reduce bug count by 20%\nImprove test coverage to 80%\nAttend 2 industry conferences",
    "Improve communication with stakeholders\nComplete leadership training\nDeliver 3 successful projects",
]

def create_performance_reviews():
    print("\n⭐ Creating Performance Reviews...")
    employees = get_all_employees()
    managers = get_managers()
    count = 0
    today = date.today()

    for employee in employees:
        # 1–2 reviews per employee (quarterly periods)
        for review_idx in range(random.randint(1, 2)):
            months_back = (review_idx + 1) * 3
            period_start = today - timedelta(days=months_back * 30 + 90)
            period_end = today - timedelta(days=months_back * 30)

            if PerformanceReview.objects.filter(
                employee=employee,
                review_period_start=period_start
            ).exists():
                continue

            reviewer = random.choice(managers) if managers else None
            if not reviewer:
                continue

            rating = random.randint(3, 5)

            PerformanceReview.objects.create(
                employee=employee,
                reviewer=reviewer,
                review_period_start=period_start,
                review_period_end=period_end,
                rating=rating,
                comments=random.choice(REVIEW_FEEDBACK),
                goals=random.choice(REVIEW_GOALS_TEMPLATES),
            )
            count += 1

    print(f"  ✅ Created {count} performance reviews")


# ─────────────────────────────────────────────────────────────────────────────
# 5. Holidays
# ─────────────────────────────────────────────────────────────────────────────

HOLIDAYS_2026 = [
    ('Republic Day', date(2026, 1, 26)),
    ('Holi', date(2026, 3, 13)),
    ('Good Friday', date(2026, 4, 3)),
    ('Maharashtra Day', date(2026, 5, 1)),
    ('Eid ul-Fitr', date(2026, 3, 31)),
    ('Buddha Purnima', date(2026, 5, 12)),
    ('Independence Day', date(2026, 8, 15)),
    ('Janmashtami', date(2026, 8, 22)),
    ('Gandhi Jayanti', date(2026, 10, 2)),
    ('Dussehra', date(2026, 10, 21)),
    ('Diwali', date(2026, 11, 9)),
    ('Diwali Holiday', date(2026, 11, 10)),
    ('Guru Nanak Jayanti', date(2026, 11, 24)),
    ('Christmas', date(2026, 12, 25)),
    ('New Year Eve', date(2026, 12, 31)),
]

def create_holidays():
    print("\n🎉 Creating Holidays...")
    count = 0
    for name, hdate in HOLIDAYS_2026:
        if not Holiday.objects.filter(name=name, date=hdate).exists():
            Holiday.objects.create(
                name=name,
                date=hdate,
                description=f"{name} — National/Regional public holiday",
                is_recurring=True,
            )
            count += 1
    print(f"  ✅ Created {count} holidays for 2026")


# ─────────────────────────────────────────────────────────────────────────────
# 6. Asset Categories + Assets
# ─────────────────────────────────────────────────────────────────────────────

ASSET_CATEGORIES = [
    {'name': 'Laptops & Computers', 'code': 'LAP', 'description': 'Laptops and desktop computers', 'depreciation_rate': Decimal('25')},
    {'name': 'Mobile Phones', 'code': 'MOB', 'description': 'Company issued smartphones', 'depreciation_rate': Decimal('25')},
    {'name': 'Networking Equipment', 'code': 'NET', 'description': 'Switches, routers, access points', 'depreciation_rate': Decimal('15')},
    {'name': 'Furniture & Fixtures', 'code': 'FUR', 'description': 'Office furniture', 'depreciation_rate': Decimal('10')},
    {'name': 'Office Equipment', 'code': 'OEQ', 'description': 'Printers, scanners, projectors', 'depreciation_rate': Decimal('20')},
    {'name': 'Servers & Storage', 'code': 'SRV', 'description': 'Server infrastructure and storage', 'depreciation_rate': Decimal('20')},
]

ASSETS_DATA = [
    # Laptops
    ('Dell Latitude 5540', 'LAP', 'Lenovo', 'LAT-5540', Decimal('85000'), 'good'),
    ('HP EliteBook 840', 'LAP', 'HP', 'EB-840-G9', Decimal('92000'), 'good'),
    ('Apple MacBook Pro 14"', 'LAP', 'Apple', 'MBP-14-M3', Decimal('185000'), 'new'),
    ('Lenovo ThinkPad X1 Carbon', 'LAP', 'Lenovo', 'X1C-G11', Decimal('145000'), 'good'),
    ('Dell XPS 15', 'LAP', 'Dell', 'XPS-15-9530', Decimal('165000'), 'new'),
    ('HP ProBook 450', 'LAP', 'HP', 'PB-450-G10', Decimal('72000'), 'fair'),
    ('Asus ZenBook 14', 'LAP', 'Asus', 'ZB-14-2024', Decimal('78000'), 'good'),
    ('Acer Aspire 5', 'LAP', 'Acer', 'AS5-A515', Decimal('55000'), 'fair'),

    # Mobile Phones
    ('iPhone 15 Pro', 'MOB', 'Apple', 'IP15P-256', Decimal('134900'), 'new'),
    ('Samsung Galaxy S24', 'MOB', 'Samsung', 'SGS24-BLK', Decimal('79999'), 'good'),
    ('OnePlus 12', 'MOB', 'OnePlus', 'OP12-12GB', Decimal('64999'), 'good'),
    ('Google Pixel 8', 'MOB', 'Google', 'PIX8-128', Decimal('75999'), 'new'),

    # Networking
    ('Cisco Catalyst 2960 Switch', 'NET', 'Cisco', 'CAT2960-24TC', Decimal('45000'), 'good'),
    ('TP-Link Archer AX73 Router', 'NET', 'TP-Link', 'AX73-V1', Decimal('12000'), 'good'),
    ('Ubiquiti UniFi AP AC Pro', 'NET', 'Ubiquiti', 'UAP-AC-PRO', Decimal('18000'), 'good'),

    # Furniture
    ('Ergonomic Office Chair', 'FUR', 'Herman Miller', 'HM-AERON-B', Decimal('42000'), 'good'),
    ('Standing Desk 180cm', 'FUR', 'Ikea', 'BEKANT-180', Decimal('28000'), 'good'),
    ('Conference Table 12-seater', 'FUR', 'Godrej Interio', 'GOD-CT-12', Decimal('95000'), 'good'),
    ('Visitor Chair Set (4)', 'FUR', 'Wipro Furniture', 'WF-VC-SET4', Decimal('22000'), 'fair'),

    # Office Equipment
    ('Canon ImageRunner 2630', 'OEQ', 'Canon', 'IR2630-MFP', Decimal('75000'), 'good'),
    ('Epson EcoTank L6290', 'OEQ', 'Epson', 'ET-L6290', Decimal('22000'), 'good'),
    ('Dell UltraSharp 27" Monitor', 'OEQ', 'Dell', 'U2722D-27', Decimal('48000'), 'new'),
    ('BenQ PD2705UA Monitor', 'OEQ', 'BenQ', 'PD2705UA', Decimal('52000'), 'new'),
    ('Logitech MX Master 3 Mouse', 'OEQ', 'Logitech', 'MXM3-GRY', Decimal('8000'), 'good'),

    # Servers
    ('Dell PowerEdge R740 Server', 'SRV', 'Dell', 'PE-R740-2U', Decimal('850000'), 'good'),
    ('Synology NAS DS923+', 'SRV', 'Synology', 'DS923P-4BAY', Decimal('55000'), 'good'),
    ('HPE ProLiant DL380 Gen10', 'SRV', 'HP', 'DL380-G10', Decimal('720000'), 'good'),
]

def create_assets():
    print("\n💻 Creating Asset Categories & Assets...")

    # Create categories first
    category_map = {}
    for cat_data in ASSET_CATEGORIES:
        cat, created = AssetCategory.objects.get_or_create(
            code=cat_data['code'],
            defaults=cat_data
        )
        category_map[cat_data['code']] = cat
        if created:
            print(f"  📁 Category: {cat.name}")

    employees = get_all_employees()
    departments = list(Department.objects.all())
    users = [e.user for e in employees]
    today = date.today()
    count = 0

    for i, (asset_name, cat_code, manufacturer, model_num, price, condition) in enumerate(ASSETS_DATA):
        asset_id = f"AST-{date.today().year}-{i+1:03d}"
        if Asset.objects.filter(asset_id=asset_id).exists():
            continue

        category = category_map.get(cat_code)
        purchase_date = today - timedelta(days=random.randint(30, 730))
        depreciation_per_year = (float(category.depreciation_rate) / 100) if category else 0.15
        years_old = (today - purchase_date).days / 365
        current_value = round(float(price) * max(0.1, 1 - depreciation_per_year * years_old), 2)

        # Some assets assigned to employees, rest available
        is_assigned = cat_code in ('LAP', 'MOB') and random.random() > 0.2 and users
        assigned_user = random.choice(users) if is_assigned else None

        Asset.objects.create(
            asset_id=asset_id,
            name=asset_name,
            category=category,
            description=f"{manufacturer} {asset_name} — company owned asset",
            purchase_date=purchase_date,
            purchase_price=price,
            current_value=Decimal(str(current_value)),
            vendor=f"{manufacturer} Authorized Dealer",
            invoice_number=f"VINV-{purchase_date.year}-{random.randint(1000, 9999)}",
            warranty_expiry=purchase_date + timedelta(days=365),
            status='assigned' if assigned_user else random.choice(['available', 'available', 'maintenance']),
            condition=condition,
            location=random.choice(['Mumbai Office', 'Bangalore Office', 'Delhi Office', 'Remote']),
            assigned_to=assigned_user,
            department=random.choice(departments) if departments else None,
            serial_number=f"SN{random.randint(100000000, 999999999)}",
            model_number=model_num,
            manufacturer=manufacturer,
            notes=f"Purchased from authorized dealer. Warranty until {purchase_date + timedelta(days=365)}.",
        )
        count += 1

    print(f"  ✅ Created {count} assets across {len(ASSET_CATEGORIES)} categories")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Software Licenses + Assignments
# ─────────────────────────────────────────────────────────────────────────────

SOFTWARE_LICENSES = [
    ('Microsoft 365 Business Premium', 'MS365-ENT-2024', 'Microsoft', 50, Decimal('15000'), True),
    ('Adobe Creative Cloud All Apps', 'ADCC-ALL-2024', 'Adobe Inc', 10, Decimal('54000'), True),
    ('GitHub Enterprise', 'GH-ENT-2024', 'GitHub Inc', 25, Decimal('95000'), True),
    ('Jira Software Cloud', 'JIRA-CLD-2024', 'Atlassian', 30, Decimal('42000'), True),
    ('Slack Pro', 'SLK-PRO-2024', 'Salesforce', 50, Decimal('28000'), True),
    ('Zoom Business', 'ZM-BIZ-2024', 'Zoom Video', 25, Decimal('18500'), True),
    ('Figma Professional', 'FIG-PRO-2024', 'Figma Inc', 8, Decimal('24000'), True),
    ('VS Code (Enterprise)', 'VSC-ENT-2024', 'Microsoft', 40, Decimal('0'), False),
    ('Postman API Platform', 'POST-TEAM-2024', 'Postman Inc', 20, Decimal('32000'), True),
    ('AWS Enterprise Support', 'AWS-ENT-2024', 'Amazon Web Services', 1, Decimal('125000'), True),
]

def create_software_licenses():
    print("\n🔑 Creating Software Licenses...")
    today = date.today()
    users = get_all_users()
    count = 0

    for name, key, vendor, seats, cost, is_sub in SOFTWARE_LICENSES:
        if SoftwareLicense.objects.filter(name=name).exists():
            continue
        license = SoftwareLicense.objects.create(
            name=name,
            key=key,
            vendor=vendor,
            seats=seats,
            purchase_date=today - timedelta(days=random.randint(30, 200)),
            expiry_date=today + timedelta(days=random.randint(30, 365)),
            cost=cost,
            is_subscription=is_sub,
            notes=f"License managed by IT department. Renews annually.",
        )

        # Assign to some users — clamp to available seats and users
        max_assign = min(seats, len(users))
        min_assign = min(3, max_assign)
        num_assigned = random.randint(min_assign, max_assign) if min_assign <= max_assign else max_assign
        assigned_users = random.sample(users, num_assigned)
        for user in assigned_users:
            if not LicenseAssignment.objects.filter(license=license, user=user).exists():
                LicenseAssignment.objects.create(
                    license=license,
                    user=user,
                    assigned_date=today - timedelta(days=random.randint(1, 100)),
                )
        count += 1
        print(f"  ✅ {name} ({num_assigned} assigned)")

    print(f"\n  ✅ Created {count} software licenses")


# ─────────────────────────────────────────────────────────────────────────────
# 8. Document Folders
# ─────────────────────────────────────────────────────────────────────────────

FOLDER_STRUCTURE = [
    'HR Policies',
    'Company Handbook',
    'Finance & Accounts',
    'Project Documents',
    'Legal & Compliance',
    'Training Materials',
    'Marketing Assets',
    'IT & Technology',
    'Client Contracts',
    'Meeting Notes',
]

def create_document_folders():
    print("\n📂 Creating Document Folders...")
    departments = list(Department.objects.all())
    admin_users = list(User.objects.filter(role__in=['ceo', 'hr']))
    if not admin_users:
        print("  ⚠️  No admin users found — skipping folders")
        return

    count = 0
    for folder_name in FOLDER_STRUCTURE:
        if DocumentFolder.objects.filter(name=folder_name).exists():
            continue
        dept = random.choice(departments) if departments else None
        DocumentFolder.objects.create(
            name=folder_name,
            department=dept,
            created_by=random.choice(admin_users),
        )
        count += 1
        print(f"  ✅ Created folder: {folder_name}")

    print(f"  ✅ Created {count} document folders")


# ─────────────────────────────────────────────────────────────────────────────
# 9. Extended Salary Records (6 months)
# ─────────────────────────────────────────────────────────────────────────────

def extend_salaries():
    print("\n💵 Extending Salary Records to 6 months...")
    employees = Employee.objects.select_related('user__designation').all()
    today = date.today()
    count = 0

    base_salaries = {
        'Senior': (80000, 150000),
        'Manager': (100000, 180000),
        'Developer': (50000, 90000),
        'Engineer': (45000, 85000),
        'Analyst': (40000, 70000),
        'Executive': (35000, 60000),
        'Director': (150000, 250000),
        'CEO': (200000, 350000),
    }

    for months_ago in range(4, 7):  # months 4, 5, 6 (top 3 done by populate_all_data)
        month = today.month - months_ago
        year = today.year
        while month <= 0:
            month += 12
            year -= 1

        for employee in employees:
            if Salary.objects.filter(employee=employee, month=month, year=year).exists():
                continue

            designation_title = employee.user.designation.title if employee.user.designation else 'Executive'
            key = next((k for k in base_salaries if k.lower() in designation_title.lower()), 'Executive')
            lo, hi = base_salaries[key]
            basic_salary = Decimal(random.randint(lo, hi))

            hra = (basic_salary * Decimal('0.40')).quantize(Decimal('0.01'))
            da = (basic_salary * Decimal('0.15')).quantize(Decimal('0.01'))
            special_allowance = (basic_salary * Decimal('0.10')).quantize(Decimal('0.01'))
            bonus = Decimal(random.randint(0, 10000)) if random.random() > 0.8 else Decimal('0')

            pf_employee = (basic_salary * Decimal('0.12')).quantize(Decimal('0.01'))
            pf_employer = pf_employee
            professional_tax = Decimal('200.00')
            esi_employee = (basic_salary * Decimal('0.0075')).quantize(Decimal('0.01'))

            gross_salary = basic_salary + hra + da + special_allowance + bonus
            total_deductions = pf_employee + professional_tax + esi_employee
            net_salary = gross_salary - total_deductions

            payment_day = 5  # paid on 5th of next month
            payment_date = date(year if month < 12 else year + 1, (month % 12) + 1, payment_day)

            Salary.objects.create(
                employee=employee,
                month=month,
                year=year,
                basic_salary=basic_salary,
                hra=hra,
                da=da,
                special_allowance=special_allowance,
                bonus=bonus,
                pf_employee=pf_employee,
                pf_employer=pf_employer,
                professional_tax=professional_tax,
                esi_employee=esi_employee,
                gross_salary=gross_salary,
                total_deductions=total_deductions,
                net_salary=net_salary,
                payment_date=payment_date,
                payment_status='paid',
            )
            count += 1

    print(f"  ✅ Created {count} additional salary records")


# ─────────────────────────────────────────────────────────────────────────────
# 10. Ensure Tasks are assigned to employees
# ─────────────────────────────────────────────────────────────────────────────

def assign_tasks_to_employees():
    print("\n✅ Assigning tasks to employees...")
    employees = get_all_employees()
    if not employees:
        print("  ⚠️  No employees found")
        return

    unassigned_tasks = Task.objects.filter(assignee__isnull=True)
    count = 0
    for task in unassigned_tasks:
        emp = random.choice(employees)
        task.assignee = emp.user
        task.save()
        count += 1

    print(f"  ✅ Assigned {count} tasks to employees")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 65)
    print("🚀 KAIZEN ERM — WORKSPACE & RESOURCES DATA POPULATION")
    print("=" * 65)

    create_holidays()
    leave_types = create_leave_types()
    create_attendance()
    create_leave_requests(leave_types)
    create_performance_reviews()
    create_assets()
    create_software_licenses()
    create_document_folders()
    extend_salaries()
    assign_tasks_to_employees()

    print("\n" + "=" * 65)
    print("📊 FINAL COUNTS")
    print("=" * 65)
    print(f"  ✅ Attendance Records : {Attendance.objects.count()}")
    print(f"  ✅ Leave Types        : {LeaveType.objects.count()}")
    print(f"  ✅ Leave Requests     : {LeaveRequest.objects.count()}")
    print(f"  ✅ Performance Reviews: {PerformanceReview.objects.count()}")
    print(f"  ✅ Holidays           : {Holiday.objects.count()}")
    print(f"  ✅ Asset Categories   : {AssetCategory.objects.count()}")
    print(f"  ✅ Assets             : {Asset.objects.count()}")
    print(f"  ✅ Software Licenses  : {SoftwareLicense.objects.count()}")
    print(f"  ✅ Document Folders   : {DocumentFolder.objects.count()}")
    print(f"  ✅ Salary Records     : {Salary.objects.count()}")
    print(f"  ✅ Tasks (total)      : {Task.objects.count()}")
    print("=" * 65)
    print("\n🎉 Workspace & Resources data population complete!\n")


if __name__ == '__main__':
    main()
