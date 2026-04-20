from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Q
from datetime import datetime, date
import csv
from .models import Employee, Attendance, LeaveType, LeaveRequest, Salary, Holiday, PerformanceReview
from .serializers import (
    EmployeeSerializer, AttendanceSerializer, LeaveTypeSerializer,
    LeaveRequestSerializer, SalarySerializer, SalarySummarySerializer,
    HolidaySerializer, PerformanceReviewSerializer
)


class IsHROrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ceo', 'hr', 'project_manager']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('user', 'user__department', 'user__designation')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """Create both User and Employee profile"""
        from apps.users.models import User, Department, Designation
        
        # Check permissions
        if request.user.role not in ['ceo', 'hr']:
            return Response({'error': 'Only CEO and HR can create employees'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'department', 'designation']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get department and designation
            department = Department.objects.get(id=data['department'])
            designation = Designation.objects.get(id=data['designation'])
            
            # Create User
            user = User.objects.create_user(
                email=data['email'],
                password=data.get('password', 'employee123'),  # Default password
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data.get('phone', ''),
                city=data.get('city', 'Mumbai'),
                state=data.get('state', 'Maharashtra'),
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
                employment_type='full_time',
                casual_leave_balance=12,
                sick_leave_balance=12,
                earned_leave_balance=15
            )
            
            serializer = self.get_serializer(employee)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Department.DoesNotExist:
            return Response({'error': 'Invalid department'}, status=status.HTTP_400_BAD_REQUEST)
        except Designation.DoesNotExist:
            return Response({'error': 'Invalid designation'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        """Update User and Employee profile"""
        from apps.users.models import Department, Designation
        
        # Check permissions
        if request.user.role not in ['ceo', 'hr']:
            return Response({'error': 'Only CEO and HR can update employees'}, status=status.HTTP_403_FORBIDDEN)
        
        employee = self.get_object()
        data = request.data
        
        try:
            # Update User fields
            user = employee.user
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'phone' in data:
                user.phone = data['phone']
            if 'city' in data:
                user.city = data['city']
            if 'department' in data:
                user.department = Department.objects.get(id=data['department'])
            if 'designation' in data:
                user.designation = Designation.objects.get(id=data['designation'])
            user.save()
            
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

    @action(detail=True, methods=['get'])
    def get_attendance_report(self, request, pk=None):
        employee = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        attendance = Attendance.objects.filter(employee=employee)
        if start_date:
            attendance = attendance.filter(date__gte=start_date)
        if end_date:
            attendance = attendance.filter(date__lte=end_date)
            
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def get_leave_balance(self, request, pk=None):
        employee = self.get_object()
        return Response({
            'casual': employee.casual_leave_balance,
            'sick': employee.sick_leave_balance,
            'earned': employee.earned_leave_balance,
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee', 'employee__user')
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ceo', 'hr', 'project_manager']:
            return Attendance.objects.all()
        # Employees see only their own attendance
        try:
            employee = Employee.objects.get(user=user)
            return Attendance.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Attendance.objects.none()

    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """Always returns only the requesting user's own attendance records"""
        try:
            employee = Employee.objects.get(user=request.user)
            qs = Attendance.objects.filter(employee=employee).order_by('-date')
            serializer = AttendanceSerializer(qs, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response([])

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            today = date.today()
            attendance, created = Attendance.objects.get_or_create(
                employee=employee,
                date=today,
                defaults={
                    'check_in': timezone.now().time(),
                    'status': 'present' if timezone.now().hour < 10 else 'late'
                }
            )
            if not created and attendance.check_in:
                # Already checked in — return the existing record (not an error)
                return Response(AttendanceSerializer(attendance).data)
            attendance.check_in = timezone.now().time()
            attendance.status = 'present' if timezone.now().hour < 10 else 'late'
            attendance.save()
            return Response(AttendanceSerializer(attendance).data)
        except Employee.DoesNotExist:
            return Response({'error': 'No employee profile linked to your account. Please contact HR.'}, status=404)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            today = date.today()
            try:
                attendance = Attendance.objects.get(employee=employee, date=today)
            except Attendance.DoesNotExist:
                return Response({'error': 'No check-in found for today. Please check in first.'}, status=400)
            
            attendance.check_out = timezone.now().time()
            # Calculate hours worked
            if attendance.check_in:
                check_in_dt = datetime.combine(today, attendance.check_in)
                check_out_dt = datetime.combine(today, attendance.check_out)
                hours = (check_out_dt - check_in_dt).seconds / 3600
                attendance.hours_worked = round(hours, 2)
            attendance.save()
            return Response(AttendanceSerializer(attendance).data)
        except Employee.DoesNotExist:
            return Response({'error': 'No employee profile linked to your account. Please contact HR.'}, status=404)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee', 'employee__user', 'leave_type')
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ceo', 'hr', 'project_manager']:
            return LeaveRequest.objects.all()
        try:
            employee = Employee.objects.get(user=user)
            return LeaveRequest.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return LeaveRequest.objects.none()

    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'employee': 'No employee profile linked to your account. Please contact HR.'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ['ceo', 'hr', 'project_manager']:
            return Response({'error': 'Permission denied'}, status=403)
        leave = self.get_object()
        leave.status = 'approved'
        leave.approved_by = request.user
        leave.approved_on = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role not in ['ceo', 'hr', 'project_manager']:
            return Response({'error': 'Permission denied'}, status=403)
        leave = self.get_object()
        leave.status = 'rejected'
        leave.approved_by = request.user
        leave.approved_on = timezone.now()
        leave.rejection_reason = request.data.get('reason', '')
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)


class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.select_related('employee', 'employee__user')
    serializer_class = SalarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only CEO, HR, Stakeholders can see all salaries
        if user.role in ['ceo', 'hr', 'stakeholder']:
            return Salary.objects.all()
        # Others see only their own
        try:
            employee = Employee.objects.get(user=user)
            return Salary.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Salary.objects.none()

    def get_serializer_class(self):
        user = self.request.user
        if user.role in ['ceo', 'hr', 'stakeholder']:
            return SalarySerializer
        return SalarySummarySerializer

    @action(detail=False, methods=['get'])
    def my_salary(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            salaries = Salary.objects.filter(employee=employee).order_by('-year', '-month')[:12]
            serializer = SalarySummarySerializer(salaries, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

    @action(detail=True, methods=['get'])
    def download_slip(self, request, pk=None):
        salary = self.get_object()
        emp = salary.employee
        # Security: employees can only download their own slip
        if request.user.role not in ['ceo', 'hr', 'stakeholder']:
            try:
                if emp.user != request.user:
                    return Response({'error': 'Permission denied'}, status=403)
            except Exception:
                return Response({'error': 'Permission denied'}, status=403)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="salary_slip_{emp.employee_id}_{salary.month}_{salary.year}.csv"'
        )
        writer = csv.writer(response)

        # Header
        writer.writerow(['SALARY SLIP - KAIZEN ERM'])
        writer.writerow([])
        writer.writerow(['Employee Name', emp.user.get_full_name()])
        writer.writerow(['Employee ID', emp.employee_id])
        writer.writerow(['Department', emp.user.department.name if emp.user.department else '—'])
        writer.writerow(['Designation', emp.user.designation.name if emp.user.designation else '—'])
        writer.writerow(['Month / Year', f'{salary.month} / {salary.year}'])
        writer.writerow([])

        # Earnings
        writer.writerow(['--- EARNINGS ---', ''])
        writer.writerow(['Basic Salary', f'₹{salary.basic_salary}'])
        writer.writerow(['HRA (House Rent Allowance)', f'₹{salary.hra}'])
        writer.writerow(['DA (Dearness Allowance)', f'₹{salary.da}'])
        writer.writerow(['Special Allowance', f'₹{salary.special_allowance}'])
        writer.writerow(['Conveyance Allowance', f'₹{salary.conveyance}'])
        writer.writerow(['Medical Allowance', f'₹{salary.medical_allowance}'])
        writer.writerow(['LTA (Leave Travel Allowance)', f'₹{salary.lta}'])
        writer.writerow(['Bonus', f'₹{salary.bonus}'])
        writer.writerow(['Overtime', f'₹{salary.overtime}'])
        writer.writerow(['GROSS SALARY', f'₹{salary.gross_salary}'])
        writer.writerow([])

        # Deductions
        writer.writerow(['--- DEDUCTIONS ---', ''])
        writer.writerow(['PF (Employee 12%)', f'₹{salary.pf_employee}'])
        writer.writerow(['PF (Employer 12%)', f'₹{salary.pf_employer}'])
        writer.writerow(['ESI (Employee 0.75%)', f'₹{salary.esi_employee}'])
        writer.writerow(['ESI (Employer 3.25%)', f'₹{salary.esi_employer}'])
        writer.writerow(['Professional Tax', f'₹{salary.professional_tax}'])
        writer.writerow(['TDS (Tax Deducted at Source)', f'₹{salary.tds}'])
        writer.writerow(['Other Deductions', f'₹{salary.other_deductions}'])
        writer.writerow(['TOTAL DEDUCTIONS', f'₹{salary.total_deductions}'])
        writer.writerow([])

        # Net
        writer.writerow(['NET SALARY (Take-Home)', f'₹{salary.net_salary}'])
        writer.writerow([])
        writer.writerow(['Payment Status', salary.payment_status or 'Pending'])
        writer.writerow(['Payment Date', salary.payment_date if salary.payment_date else 'Pending'])
        writer.writerow([])
        writer.writerow(['--- This is a computer-generated salary slip ---'])
        return response


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related('employee', 'reviewer')
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ceo', 'hr']:
            return PerformanceReview.objects.all()
        elif user.role == 'project_manager':
            return PerformanceReview.objects.filter(
                Q(reviewer=user) | 
                Q(employee__reporting_manager=user)
            )
        try:
            employee = Employee.objects.get(user=user)
            return PerformanceReview.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return PerformanceReview.objects.none()
