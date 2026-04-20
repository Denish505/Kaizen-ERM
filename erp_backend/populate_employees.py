import os
import django
import random
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Department, Designation
from apps.hrm.models import Employee

# Indian Names Database
FIRST_NAMES_MALE = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan',
    'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advaith', 'Pranav', 'Dhruv',
    'Aryan', 'Kabir', 'Yash', 'Reyansh', 'Ayush', 'Rohan', 'Samarth', 'Vansh',
    'Rudra', 'Parth', 'Arav', 'Karan', 'Vedant', 'Shivansh', 'Tanish'
]

FIRST_NAMES_FEMALE = [
    'Aadhya', 'Ananya', 'Diya', 'Aanya', 'Sara', 'Pari', 'Aaradhya', 'Angel',
    'Kavya', 'Saanvi', 'Pihu', 'Navya', 'Myra', 'Anika', 'Aditi', 'Riya',
    'Shanaya', 'Avni', 'Ishita', 'Kiara', 'Priya', 'Sneha', 'Pooja', 'Ritika',
    'Divya', 'Nisha', 'Anjali', 'Sakshi', 'Tanvi', 'Shruti'
]

LAST_NAMES = [
    'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Reddy', 'Rao',
    'Iyer', 'Nair', 'Menon', 'Pillai', 'Agarwal', 'Joshi', 'Desai', 'Mehta',
    'Shah', 'Das', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Bhatt', 'Thakur',
    'Pandey', 'Mishra', 'Jain', 'Kapoor', 'Chopra', 'Malhotra', 'Khanna',
    'Saxena', 'Sinha', 'Bose', 'Dutta', 'Ghosh', 'Kulkarni', 'Kaur', 'Yadav'
]

CITIES = [
    'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 
    'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Nagpur',
    'Indore', 'Chandigarh', 'Kochi', 'Visakhapatnam', 'Bhopal', 'Coimbatore'
]

BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

def create_employee(first_name, last_name, gender, department, designation, city):
    """Create a user and employee profile"""
    email = f"{first_name.lower()}.{last_name.lower()}@kaizen.com"
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"  ⚠️  User {email} already exists, skipping...")
        return None
    
    # Create User
    user = User.objects.create_user(
        email=email,
        password='employee123',  # Default password for all employees
        first_name=first_name,
        last_name=last_name,
        phone=f"+91-{random.randint(7000000000, 9999999999)}",
        city=city,
        state='Maharashtra' if city == 'Mumbai' else 'Karnataka' if city == 'Bangalore' else 'Delhi',
        department=department,
        designation=designation,
        role='employee',
        is_active=True
    )
    
    # Generate employee ID
    employee_count = Employee.objects.count() + 1
    employee_id = f"KZN{employee_count:04d}"
    
    # Create Employee Profile
    employee = Employee.objects.create(
        user=user,
        employee_id=employee_id,
        gender=gender,
        blood_group=random.choice(BLOOD_GROUPS),
        emergency_contact_name=f"{random.choice(FIRST_NAMES_MALE if gender == 'M' else FIRST_NAMES_FEMALE)} {random.choice(LAST_NAMES)}",
        emergency_contact_phone=f"+91-{random.randint(7000000000, 9999999999)}",
        employment_type='full_time',
        casual_leave_balance=12,
        sick_leave_balance=12,
        earned_leave_balance=15
    )
    
    print(f"  ✅ Created: {first_name} {last_name} ({employee_id}) - {designation.title} in {department.name}")
    return employee

def populate_employees():
    print("\n🚀 Starting Employee Population Script\n")
    
    # Get all departments and designations
    departments = list(Department.objects.all())
    designations = list(Designation.objects.all())
    
    if not departments or not designations:
        print("❌ Error: No departments or designations found. Please create them first.")
        return
    
    print(f"📊 Found {len(departments)} departments and {len(designations)} designations\n")
    
    # Target: Create 50 employees
    target_count = 50
    current_count = Employee.objects.count()
    
    print(f"📈 Current employees: {current_count}")
    print(f"🎯 Target employees: {target_count}\n")
    
    employees_to_create = target_count - current_count
    
    if employees_to_create <= 0:
        print("✅ Database already has enough employees!")
        return
    
    print(f"➕ Creating {employees_to_create} new employees...\n")
    
    created = 0
    attempts = 0
    max_attempts = employees_to_create * 2
    
    while created < employees_to_create and attempts < max_attempts:
        attempts += 1
        
        # Random gender
        gender = random.choice(['M', 'F'])
        first_name = random.choice(FIRST_NAMES_MALE if gender == 'M' else FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)
        
        # Random department and designation
        department = random.choice(departments)
        designation = random.choice(designations)
        
        # Random city
        city = random.choice(CITIES)
        
        # Create employee
        employee = create_employee(first_name, last_name, gender, department, designation, city)
        
        if employee:
            created += 1
    
    print(f"\n✨ Successfully created {created} new employees!")
    print(f"📊 Total employees in database: {Employee.objects.count()}\n")
    
    # Show summary by department
    print("📈 Employee Distribution by Department:")
    for dept in departments:
        count = Employee.objects.filter(user__department=dept).count()
        print(f"   {dept.name}: {count} employees")
    
    print("\n🎉 Population complete!\n")

if __name__ == '__main__':
    populate_employees()
