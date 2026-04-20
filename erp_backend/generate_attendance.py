import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.hrm.models import Employee, Attendance
from apps.users.models import User

def generate_attendance():
    print("Generating 1 year attendance for CEO...")
    try:
        user = User.objects.get(email='ceo@kaizen.com')
        employee = Employee.objects.get(user=user)
    except Exception as e:
        print("Error finding CEO:", e)
        return
        
    # Start from Jan 1st 2025 (or 1 year ago) to today
    end_date = date.today()
    start_date = date(end_date.year - 1, 1, 1)
    
    current_date = start_date
    created_count = 0
    
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Monday to Friday
            status_choice = random.choices(
                ['present', 'late', 'absent', 'on_leave'],
                weights=[85, 10, 2, 3] # Very reliable CEO
            )[0]
            
            if status_choice in ['present', 'late']:
                in_hour = 9 if status_choice == 'present' else random.randint(10, 11)
                in_minute = random.randint(0, 59)
                out_hour = random.randint(17, 19)
                out_minute = random.randint(0, 59)
                
                check_in = f"{in_hour:02d}:{in_minute:02d}"
                check_out = f"{out_hour:02d}:{out_minute:02d}"
                
                # Approximate hours
                hours = round((out_hour + out_minute/60.0) - (in_hour + in_minute/60.0), 1)
            else:
                check_in = None
                check_out = None
                hours = 0.0
                
            Attendance.objects.update_or_create(
                employee=employee,
                date=current_date,
                defaults={
                    'check_in': check_in,
                    'check_out': check_out,
                    'status': status_choice,
                    'hours_worked': hours,
                    'notes': ''
                }
            )
            created_count += 1
        current_date += timedelta(days=1)
        
    print(f"Done! Created/Updated {created_count} attendance records for {user.email}")

if __name__ == '__main__':
    generate_attendance()
