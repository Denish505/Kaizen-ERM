import os
import django
import random
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Department
from apps.hrm.models import Employee, Salary
from apps.clients.models import Client, Lead
from apps.projects.models import Project, Task
from apps.finance.models import Invoice, Expense

# Indian Company Names
COMPANY_NAMES = [
    'TechVista Solutions', 'Infosys Technologies', 'Wipro Digital', 'HCL Innovations',
    'Tata Consultancy', 'Mahindra Tech', 'Reliance Industries', 'Bharti Enterprises',
    'Adani Group', 'Godrej Solutions', 'Bajaj Technologies', 'Larsen & Toubro',
    'Aditya Birla Group', 'Vedanta Resources', 'JSW Steel Ltd', 'ICICI Services',
    'HDFC Solutions', 'Axis Technologies', 'Kotak Digital', 'Yes Bank Tech',
    'Flipkart Commerce', 'Paytm Services', 'Ola Technologies', 'Zomato Solutions',
    'Swiggy Services', 'BigBasket Tech', 'MakeMyTrip', 'OYO Rooms',
    'PhonePe Digital', 'Razorpay Services', 'Freshworks Solutions', 'Zoho Corporation'
]

INDIAN_CITIES = [
    'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 
    'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Nagpur'
]

CONTACT_FIRST_NAMES = [
    'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Karan', 'Pooja',
    'Arjun', 'Kavya', 'Rohit', 'Neha', 'Sanjay', 'Deepika', 'Manish', 'Ritu'
]

CONTACT_LAST_NAMES = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Mehta',
    'Shah', 'Joshi', 'Desai', 'Kapoor', 'Malhotra', 'Chopra', 'Agarwal'
]

PROJECT_TYPES = [
    'Web Development', 'Mobile App', 'Cloud Migration', 'ERP Implementation',
    'Data Analytics', 'AI/ML Solution', 'Digital Marketing', 'Cybersecurity',
    'DevOps', 'UI/UX Design', 'API Integration', 'Blockchain'
]

EXPENSE_CATEGORIES = [
    'Office Supplies', 'Travel', 'Software Licenses', 'Hardware',
    'Marketing', 'Training', 'Utilities', 'Internet', 'Equipment',
    'Consulting', 'Legal', 'Subscriptions'
]

def get_random_employee():
    """Get a random employee"""
    employees = list(Employee.objects.all())
    return random.choice(employees) if employees else None

def get_random_user():
    """Get a random user"""
    users = list(User.objects.filter(role__in=['ceo', 'hr', 'project_manager', 'employee']))
    return random.choice(users) if users else None

def create_clients():
    """Create 20 clients"""
    print("\n📋 Creating Clients...")
    clients = []
    
    for i in range(20):
        company = random.choice(COMPANY_NAMES)
        city = random.choice(INDIAN_CITIES)
        contact_first = random.choice(CONTACT_FIRST_NAMES)
        contact_last = random.choice(CONTACT_LAST_NAMES)
        
        # Check if client exists
        if Client.objects.filter(company_name=company).exists():
            continue
            
        client = Client.objects.create(
            name=f"{contact_first} {contact_last}",
            company_name=company,
            email=f"info@{company.lower().replace(' ', '').replace('&', '')}.in",
            phone=f"+91-{random.randint(7000000000, 9999999999)}",
            address=f"{random.randint(1, 999)}, MG Road",
            city=city,
            state='Maharashtra' if city == 'Mumbai' else 'Karnataka' if city == 'Bangalore' else 'Delhi',
            pincode=f"{random.randint(100000, 999999)}",
            country='India',
            gstin=f"29{random.randint(10000000000, 99999999999)}Z{random.randint(1, 9)}",
            pan=f"ABCDE{random.randint(1000, 9999)}F",
            industry=random.choice(['Technology', 'Consulting', 'Manufacturing', 'Retail', 'Healthcare']),
            website=f"https://www.{company.lower().replace(' ', '').replace('&', '')}.in",
            status=random.choice(['active', 'active', 'active', 'prospect']),
            notes=f"Leading {random.choice(['technology', 'consulting', 'service', 'manufacturing'])} company based in {city}"
        )
        clients.append(client)
        print(f"  ✅ Created client: {company}")
    
    print(f"\n✨ Created {len(clients)} clients")
    return clients

def create_leads():
    """Create 15 leads"""
    print("\n🎯 Creating Leads...")
    leads = []
    
    for i in range(15):
        company = random.choice(COMPANY_NAMES)
        contact_first = random.choice(CONTACT_FIRST_NAMES)
        contact_last = random.choice(CONTACT_LAST_NAMES)
        
        # Check if lead exists
        if Lead.objects.filter(company=company).exists():
            continue
            
        assigned_to = get_random_user()
        
        lead = Lead.objects.create(
            name=f"{contact_first} {contact_last}",
            company=company,
            email=f"{contact_first.lower()}.{contact_last.lower()}@{company.lower().replace(' ', '').replace('&', '')}.in",
            phone=f"+91-{random.randint(7000000000, 9999999999)}",
            city=random.choice(INDIAN_CITIES),
            source=random.choice(['website', 'referral', 'cold_call', 'linkedin', 'event']),
            stage=random.choice(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
            assigned_to=assigned_to,
            expected_value=Decimal(random.randint(500000, 5000000)),
            probability=random.randint(10, 90),
            expected_close_date=date.today() + timedelta(days=random.randint(15, 90)),
            notes=f"Interested in {random.choice(PROJECT_TYPES)} services"
        )
        leads.append(lead)
        print(f"  ✅ Created lead: {company}")
    
    print(f"\n✨ Created {len(leads)} leads")
    return leads

def create_projects(clients):
    """Create 25 projects linked to clients"""
    print("\n🚀 Creating Projects...")
    projects = []
    
    project_managers = list(User.objects.filter(role__in=['ceo', 'project_manager']))
    existing_count = Project.objects.count()
    
    for i in range(25):
        client = random.choice(clients) if clients else None
        if not client:
            continue
            
        project_type = random.choice(PROJECT_TYPES)
        start_date = date.today() - timedelta(days=random.randint(30, 180))
        duration = random.randint(30, 180)
        end_date = start_date + timedelta(days=duration)
        deadline = end_date + timedelta(days=random.randint(-10, 10))
        
        # Generate unique project code
        project_code = f"PRJ-{date.today().year}-{existing_count + i + 1:03d}"
        
        # Check if code exists
        if Project.objects.filter(code=project_code).exists():
            continue
        
        project = Project.objects.create(
            name=f"{project_type} for {client.company_name}",
            code=project_code,
            description=f"Complete {project_type.lower()} solution including planning, development, testing and deployment",
            client=client,
            project_manager=random.choice(project_managers) if project_managers else None,
            start_date=start_date,
            end_date=end_date,
            deadline=deadline,
            budget=Decimal(random.randint(500000, 10000000)),
            spent=Decimal(random.randint(0, 500000)),
            status=random.choice(['planning', 'in_progress', 'in_progress', 'in_progress', 'on_hold', 'completed']),
            priority=random.choice(['low', 'medium', 'medium', 'high', 'urgent']),
            progress=random.randint(0, 100)
        )
        
        projects.append(project)
        print(f"  ✅ Created project: {project.name[:50]}...")
    
    print(f"\n✨ Created {len(projects)} projects")
    return projects

def create_invoices(clients, projects):
    """Create 30 invoices"""
    print("\n💰 Creating Invoices...")
    invoices = []
    
    for i in range(30):
        client = random.choice(clients) if clients else None
        project = random.choice(projects) if projects else None
        
        if not client:
            continue
            
        issue_date = date.today() - timedelta(days=random.randint(0, 120))
        due_date = issue_date + timedelta(days=30)
        
        subtotal = Decimal(random.randint(100000, 2000000))
        
        # Calculate GST (18% split into CGST 9% + SGST 9% for intra-state)
        cgst_rate = Decimal('9.0')
        sgst_rate = Decimal('9.0')
        cgst_amount = (subtotal * cgst_rate / 100).quantize(Decimal('0.01'))
        sgst_amount = (subtotal * sgst_rate / 100).quantize(Decimal('0.01'))
        total_tax = cgst_amount + sgst_amount
        
        discount = Decimal(0)
        total = subtotal + total_tax - discount
        
        # Random payment status
        status = random.choice(['draft', 'sent', 'sent', 'paid', 'paid', 'overdue'])
        if status == 'paid':
            amount_paid = total
            balance_due = Decimal(0)
        else:
            amount_paid = Decimal(0)
            balance_due = total
        
        invoice = Invoice.objects.create(
            invoice_number=f"INV-{date.today().year}-{i+1:04d}",
            client=client,
            project=project,
            issue_date=issue_date,
            due_date=due_date,
            subtotal=subtotal,
            cgst_rate=cgst_rate,
            sgst_rate=sgst_rate,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            total_tax=total_tax,
            discount=discount,
            total=total,
            amount_paid=amount_paid,
            balance_due=balance_due,
            status=status,
            notes=f"Invoice for {project.name if project else 'consulting services'}",
            terms="Payment due within 30 days"
        )
        invoices.append(invoice)
        print(f"  ✅ Created invoice: {invoice.invoice_number}")
    
    print(f"\n✨ Created {len(invoices)} invoices")
    return invoices

def create_expenses(projects):
    """Create 40 expenses"""
    print("\n💸 Creating Expenses...")
    expenses = []
    
    users = list(User.objects.filter(role__in=['employee', 'project_manager'])[:30])
    departments = list(Department.objects.all())
    
    expense_categories = [
        'travel', 'food', 'office', 'software', 'hardware',
        'utilities', 'marketing', 'training', 'client', 'miscellaneous'
    ]
    
    for i in range(40):
        project = random.choice(projects) if projects and random.random() > 0.3 else None
        user = random.choice(users) if users else None
        
        if not user:
            continue
            
        expense_date = date.today() - timedelta(days=random.randint(0, 90))
        category = random.choice(expense_categories)
        amount = Decimal(random.randint(1000, 50000))
        gst_amount = (amount * Decimal('0.18')).quantize(Decimal('0.01'))
        
        # Category-specific titles
        titles = {
            'travel': ['Flight Tickets', 'Cab Fare', 'Hotel Accommodation', 'Train Tickets'],
            'food': ['Team Lunch', 'Client Dinner', 'Office Refreshments'],
            'office': ['Stationery', 'Printer Paper', 'Office Furniture'],
            'software': ['Adobe License', 'Microsoft 365', 'Jira Subscription'],
            'hardware': ['Laptop', 'Monitor', 'Keyboard', 'Mouse'],
            'utilities': ['Electricity Bill', 'Internet Bill', 'Water Bill'],
            'marketing': ['Google Ads', 'Social Media Campaign', 'Print Materials'],
            'training': ['Course Fee', 'Workshop Registration', 'Conference Pass'],
            'client': ['Client Meeting', 'Gift Items', 'Business Lunch'],
            'miscellaneous': ['Miscellaneous Expense', 'One-time Purchase']
        }
        
        title = random.choice(titles.get(category, ['Expense']))
        
        expense = Expense.objects.create(
            title=title,
            description=f"{title} for {project.name if project else 'general operations'}",
            category=category,
            amount=amount,
            date=expense_date,
            vendor=f"Vendor {random.randint(1, 50)}",
            invoice_number=f"VINV-{expense_date.year}-{i+1:04d}",
            gst_amount=gst_amount,
            submitted_by=user,
            department=user.department if hasattr(user, 'department') else random.choice(departments),
            project=project,
            status=random.choice(['pending', 'approved', 'approved', 'approved', 'rejected', 'reimbursed']),
        )
        expenses.append(expense)
        print(f"  ✅ Created expense: {title} - ₹{amount}")
    
    print(f"\n✨ Created {len(expenses)} expenses")
    return expenses

def create_salaries():
    """Create salary records for last 3 months"""
    print("\n💵 Creating Salary Records...")
    salaries = []
    
    employees = Employee.objects.all()
    current_date = date.today()
    
    # Create for last 3 months
    for months_ago in range(3):
        month = current_date.month - months_ago
        year = current_date.year
        
        if month <= 0:
            month += 12
            year -= 1
        
        print(f"\n  Processing {month}/{year}...")
        
        for employee in employees:
            # Random base salary based on designation
            base_salaries = {
                'Senior': Decimal(random.randint(80000, 150000)),
                'Manager': Decimal(random.randint(100000, 180000)),
                'Developer': Decimal(random.randint(50000, 90000)),
                'Engineer': Decimal(random.randint(45000, 85000)),
                'Analyst': Decimal(random.randint(40000, 70000)),
                'Executive': Decimal(random.randint(35000, 60000))
            }
            
            # Get base salary based on designation
            designation_title = employee.user.designation.title if employee.user.designation else 'Executive'
            basic_salary = base_salaries.get(
                next((k for k in base_salaries if k in designation_title), 'Executive'),
                Decimal(45000)
            )
            
            # Calculate components (Indian salary structure)
            hra = (basic_salary * Decimal('0.40')).quantize(Decimal('0.01'))
            da = (basic_salary * Decimal('0.15')).quantize(Decimal('0.01'))
            special_allowance = (basic_salary * Decimal('0.10')).quantize(Decimal('0.01'))
            
            # Deductions
            pf_employee = (basic_salary * Decimal('0.12')).quantize(Decimal('0.01'))
            pf_employer = pf_employee
            professional_tax = Decimal('200.00')
            
            gross_salary = basic_salary + hra + da + special_allowance
            total_deductions = pf_employee + professional_tax
            net_salary = gross_salary - total_deductions
            
            # Check if already exists
            if Salary.objects.filter(employee=employee, month=month, year=year).exists():
                continue
            
            salary = Salary.objects.create(
                employee=employee,
                month=month,
                year=year,
                basic_salary=basic_salary,
                hra=hra,
                da=da,
                special_allowance=special_allowance,
                pf_employee=pf_employee,
                pf_employer=pf_employer,
                professional_tax=professional_tax,
                gross_salary=gross_salary,
                total_deductions=total_deductions,
                net_salary=net_salary,
                payment_status='paid' if months_ago > 0 else 'pending'
            )
            salaries.append(salary)
        
        print(f"  ✅ Created {employees.count()} salary records for {month}/{year}")
    
    print(f"\n✨ Created {len(salaries)} total salary records")
    return salaries

def populate_all_data():
    """Main function to populate all interconnected data"""
    print("\n" + "="*60)
    print("🚀 KAIZEN ERM - COMPREHENSIVE DATA POPULATION")
    print("="*60)
    
    # Create in order of dependencies
    clients = create_clients()
    leads = create_leads()
    projects = create_projects(clients)
    invoices = create_invoices(clients, projects)
    expenses = create_expenses(projects)
    salaries = create_salaries()
    
    print("\n" + "="*60)
    print("📊 FINAL SUMMARY")
    print("="*60)
    print(f"✅ Clients: {Client.objects.count()}")
    print(f"✅ Leads: {Lead.objects.count()}")
    print(f"✅ Projects: {Project.objects.count()}")
    print(f"✅ Invoices: {Invoice.objects.count()}")
    print(f"✅ Expenses: {Expense.objects.count()}")
    print(f"✅ Salaries: {Salary.objects.count()}")
    print(f"✅ Employees: {Employee.objects.count()}")
    print("="*60)
    print("\n🎉 Data population complete! All modules are interconnected.\n")

if __name__ == '__main__':
    populate_all_data()
