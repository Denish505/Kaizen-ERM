from django.contrib import admin
from .models import Employee, Attendance, LeaveType, LeaveRequest, Salary


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_user_name', 'employment_type', 'reporting_manager']
    list_filter = ['employment_type']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name']

    def get_user_name(self, obj):
        return obj.user.get_full_name()
    get_user_name.short_description = 'Name'


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in', 'check_out', 'status', 'hours_worked']
    list_filter = ['status', 'date']
    date_hierarchy = 'date'


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'days_allowed', 'is_paid', 'carry_forward']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days', 'status']
    list_filter = ['status', 'leave_type']
    date_hierarchy = 'start_date'


@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'year', 'gross_salary', 'net_salary', 'payment_status']
    list_filter = ['year', 'month', 'payment_status']
