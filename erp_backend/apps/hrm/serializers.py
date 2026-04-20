from rest_framework import serializers
from .models import Employee, Attendance, LeaveType, LeaveRequest, Salary, Holiday, PerformanceReview


class EmployeeSerializer(serializers.ModelSerializer):
    # User fields
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True, allow_null=True)
    city = serializers.CharField(source='user.city', read_only=True, allow_null=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    # Department and Designation (return IDs and names)
    department = serializers.IntegerField(source='user.department.id', read_only=True, allow_null=True)
    department_name = serializers.CharField(source='user.department.name', read_only=True, allow_null=True)
    designation = serializers.CharField(source='user.designation.title', read_only=True, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'email', 'phone', 
            'city', 'is_active', 'department', 'department_name', 'designation',
            'gender', 'blood_group', 'employment_type', 'reporting_manager',
            'casual_leave_balance', 'sick_leave_balance', 'earned_leave_balance',
            'created_at', 'updated_at'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['employee', 'status', 'approved_by', 'approved_on', 'rejection_reason']


class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    designation = serializers.CharField(source='employee.user.designation.title', read_only=True, allow_null=True)

    class Meta:
        model = Salary
        fields = '__all__'


class SalarySummarySerializer(serializers.ModelSerializer):
    """For employee's own finance view - limited fields"""
    class Meta:
        model = Salary
        fields = [
            'id', 'month', 'year', 'basic_salary', 'hra', 'da',
            'special_allowance', 'bonus', 'gross_salary', 'pf_employee',
            'esi_employee', 'professional_tax', 'tds', 'total_deductions',
            'net_salary', 'payment_date', 'payment_status'
        ]


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)

    class Meta:
        model = PerformanceReview
        fields = '__all__'
