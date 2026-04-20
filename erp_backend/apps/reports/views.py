import csv
import datetime
from django.http import HttpResponse
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model
from apps.projects.models import Project, Task
from apps.finance.models import Invoice, Expense, Budget
from apps.hrm.models import Employee
from apps.users.models import Department
from apps.clients.models import Client

User = get_user_model()

class AnalyticsDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = datetime.date.today()
        current_year = today.year
        # Allow year to be passed as a query param
        requested_year = request.query_params.get('year')
        if requested_year:
            try:
                current_year = int(requested_year)
            except (ValueError, TypeError):
                pass
        # Fiscal Year calculation (April to March for India)
        if requested_year:
            # Frontend passes the end-year of the FY (e.g., 2026 for FY 2025-26)
            start_date = datetime.date(current_year - 1, 4, 1)
            end_date = datetime.date(current_year, 3, 31)
        else:
            if today.month < 4:
                start_date = datetime.date(current_year - 1, 4, 1)
                end_date = datetime.date(current_year, 3, 31)
            else:
                start_date = datetime.date(current_year, 4, 1)
                end_date = datetime.date(current_year + 1, 3, 31)

        # KPIs
        total_revenue = Invoice.objects.filter(
            issue_date__range=[start_date, end_date], 
            status='paid'
        ).aggregate(Sum('total'))['total__sum'] or 0
        
        total_expenses = Expense.objects.filter(
            date__range=[start_date, end_date], 
            status='approved'
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        net_profit = total_revenue - total_expenses

        employee_count = Employee.objects.count()
        active_projects = Project.objects.filter(status='in_progress').count()
        
        # Monthly Revenue
        monthly_revenue = Invoice.objects.filter(
            issue_date__range=[start_date, end_date],
            status='paid'
        ).annotate(month=TruncMonth('issue_date')) \
         .values('month') \
         .annotate(revenue=Sum('total')) \
         .order_by('month')
         
        revenue_data = []
        for entry in monthly_revenue:
            revenue_data.append({
                'month': entry['month'].strftime('%b'),
                'revenue': entry['revenue']
            })

        # Department Performance
        departments = Department.objects.all()
        dept_performance = []
        for dept in departments:
             # Budget
             dept_budget = Budget.objects.filter(department=dept, year=current_year).aggregate(Sum('amount'))['amount__sum'] or 0
             # Spent
             dept_spent = Expense.objects.filter(department=dept, date__range=[start_date, end_date], status='approved').aggregate(Sum('amount'))['amount__sum'] or 0
             # Revenue (projects linked to department)
             dept_revenue = Invoice.objects.filter(project__department=dept, issue_date__range=[start_date, end_date], status='paid').aggregate(Sum('total'))['total__sum'] or 0
             
             employee_count_dept = User.objects.filter(department=dept).count()
             
             dept_performance.append({
                 'name': dept.name,
                 'employees': employee_count_dept,
                 'budget': dept_budget,
                 'spent': dept_spent,
                 'revenue': dept_revenue
             })

        # Client Revenue
        client_revenue_data = Invoice.objects.filter(
            issue_date__range=[start_date, end_date], status='paid'
        ).values('client__company_name') \
         .annotate(revenue=Sum('total')) \
         .order_by('-revenue')[:5]
         
        client_data = [{'client': c['client__company_name'], 'revenue': c['revenue']} for c in client_revenue_data]

        data = {
            'kpis': [
                {'title': 'Annual Revenue', 'value': total_revenue, 'change': '+10%', 'trend': 'up'},
                {'title': 'Net Profit', 'value': net_profit, 'change': '+5%', 'trend': 'up'},
                {'title': 'Employee Count', 'value': employee_count, 'change': '+0', 'trend': 'neutral'},
                {'title': 'Active Projects', 'value': active_projects, 'change': '+0', 'trend': 'neutral'},
            ],
            'revenue_monthly': revenue_data,
            'department_performance': dept_performance,
            'client_revenue': client_data
        }
        
        return Response(data)

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # ------------------------------------------------------------------ helpers
    def _fy_dates(self):
        today = datetime.date.today()
        if today.month < 4:
            return datetime.date(today.year - 1, 4, 1), datetime.date(today.year, 3, 31)
        return datetime.date(today.year, 4, 1), datetime.date(today.year + 1, 3, 31)

    def _fmt_inr(self, v):
        v = float(v or 0)
        if v >= 1_00_00_000: return f'₹{v/1_00_00_000:.1f}Cr'
        if v >= 1_00_000:    return f'₹{v/1_00_000:.1f}L'
        return f'₹{v:,.0f}'

    # ------------------------------------------------------------------ CEO
    def _ceo_data(self):
        from django.db.models import Q
        start, end = self._fy_dates()
        today = datetime.date.today()

        total_emp   = Employee.objects.count()
        active_proj = Project.objects.filter(status='in_progress').count()
        total_proj  = Project.objects.count()
        total_rev   = Invoice.objects.filter(status='paid', issue_date__range=[start, end]).aggregate(Sum('total'))['total__sum'] or 0
        total_exp   = Expense.objects.filter(status='approved', date__range=[start, end]).aggregate(Sum('amount'))['amount__sum'] or 0
        net_profit  = total_rev - total_exp
        open_inv    = Invoice.objects.filter(status__in=['sent', 'overdue']).aggregate(Sum('total'))['total__sum'] or 0
        pending_leaves = 0
        try:
            from apps.hrm.models import LeaveRequest
            pending_leaves = LeaveRequest.objects.filter(status='pending').count()
        except Exception: pass
        completed_proj = Project.objects.filter(status='completed').count()
        task_total     = Task.objects.count()
        task_done      = Task.objects.filter(status='completed').count()

        # Monthly revenue last 12 months
        monthly_rev = (
            Invoice.objects.filter(status='paid', issue_date__gte=today - datetime.timedelta(days=365))
            .annotate(month=TruncMonth('issue_date'))
            .values('month').annotate(value=Sum('total')).order_by('month')
        )
        revenue_trend = [{'name': e['month'].strftime('%b'), 'value': float(e['value'])} for e in monthly_rev]

        # Project status breakdown
        proj_status = list(
            Project.objects.values('status').annotate(count=Count('status'))
        )
        proj_dist = [{'name': d['status'].replace('_', ' ').title(), 'value': d['count']} for d in proj_status]

        # Task distribution
        task_dist_qs = Task.objects.values('status').annotate(count=Count('status'))
        status_map = {'todo': 'To Do', 'in_progress': 'In Progress', 'review': 'Review', 'completed': 'Completed'}
        task_dist = [{'name': status_map.get(d['status'], d['status']), 'value': d['count']} for d in task_dist_qs]

        # Top clients by revenue
        top_clients = (
            Invoice.objects.filter(status='paid', issue_date__range=[start, end])
            .values('client__company_name').annotate(value=Sum('total')).order_by('-value')[:5]
        )
        client_rev = [{'name': c['client__company_name'] or 'Unknown', 'value': float(c['value'])} for c in top_clients]

        # Recent projects
        recent_proj = Project.objects.order_by('-created_at')[:6]
        recent_projects = [{'id': p.id, 'name': p.name, 'client': p.client.company_name if p.client else 'Internal', 'progress': p.progress, 'status': p.status, 'priority': p.priority} for p in recent_proj]

        # Overdue tasks
        overdue = Task.objects.filter(due_date__lt=today).exclude(status='completed').count()

        return {
            'role': 'ceo',
            'stats': [
                {'title': 'Total Employees',   'value': str(total_emp),          'trend': 'up',     'change': 'Active',  'icon': 'Users'},
                {'title': 'Active Projects',    'value': str(active_proj),        'trend': 'neutral','change': f'{total_proj} total', 'icon': 'FolderKanban'},
                {'title': 'FY Revenue',         'value': self._fmt_inr(total_rev),'trend': 'up',     'change': f'Net {self._fmt_inr(net_profit)}', 'icon': 'DollarSign'},
                {'title': 'Open Invoices',      'value': self._fmt_inr(open_inv), 'trend': 'down',   'change': 'Receivable','icon': 'Receipt'},
                {'title': 'Task Completion',    'value': f'{int(task_done/task_total*100) if task_total else 0}%','trend': 'up','change': f'{task_done}/{task_total}','icon': 'CheckCircle2'},
                {'title': 'Pending Leaves',     'value': str(pending_leaves),     'trend': 'neutral','change': 'Awaiting', 'icon': 'Calendar'},
                {'title': 'Overdue Tasks',      'value': str(overdue),            'trend': 'down',   'change': 'Critical', 'icon': 'AlertCircle'},
                {'title': 'Completed Projects', 'value': str(completed_proj),     'trend': 'up',     'change': 'Done',     'icon': 'CheckSquare'},
            ],
            'revenueTrend': revenue_trend,
            'taskDistribution': task_dist,
            'projectDistribution': proj_dist,
            'clientRevenue': client_rev,
            'recentProjects': recent_projects,
            'pendingTasks': [],
        }

    # ------------------------------------------------------------------ HR
    def _hr_data(self):
        today = datetime.date.today()
        start, end = self._fy_dates()

        try:
            from apps.hrm.models import LeaveRequest, Attendance, Salary
            total_emp      = Employee.objects.count()
            active_emp     = Employee.objects.filter(user__is_active=True).count()
            pending_leaves = LeaveRequest.objects.filter(status='pending').count()
            approved_leaves= LeaveRequest.objects.filter(status='approved', start_date__gte=today).count()
            today_present  = Attendance.objects.filter(date=today, status__in=['present', 'late', 'wfh']).count()
            today_absent   = Attendance.objects.filter(date=today, status='absent').count()
            payroll_pending= Salary.objects.filter(payment_status='pending').count()
            payroll_paid   = Salary.objects.filter(payment_status='paid').count()

            # Leave requests recent
            recent_leaves = LeaveRequest.objects.select_related('employee__user').filter(status='pending').order_by('-applied_on')[:6]
            leave_list = [{'id': l.id, 'employee': l.employee.user.get_full_name(), 'type': l.leave_type.name, 'days': l.days, 'from': str(l.start_date), 'to': str(l.end_date)} for l in recent_leaves]

            # Department headcount
            dept_data = list(
                User.objects.filter(is_active=True).values('department__name').annotate(count=Count('id')).order_by('-count')[:8]
            )
            dept_chart = [{'name': d['department__name'] or 'Unassigned', 'value': d['count']} for d in dept_data]

            # Monthly new joins (last 6 months)
            joins = (
                Employee.objects.filter(created_at__gte=today - datetime.timedelta(days=180))
                .annotate(month=TruncMonth('created_at'))
                .values('month').annotate(value=Count('id')).order_by('month')
            )
            joins_trend = [{'name': e['month'].strftime('%b'), 'value': e['value']} for e in joins]

        except Exception:
            total_emp = active_emp = pending_leaves = approved_leaves = today_present = today_absent = payroll_pending = payroll_paid = 0
            leave_list = dept_chart = joins_trend = []

        return {
            'role': 'hr',
            'stats': [
                {'title': 'Total Employees',    'value': str(total_emp),       'trend': 'up',     'change': 'Headcount',           'icon': 'Users'},
                {'title': 'Active Today',       'value': str(today_present),   'trend': 'up',     'change': f'{today_absent} absent','icon': 'CalendarCheck'},
                {'title': 'Pending Leaves',     'value': str(pending_leaves),  'trend': 'down',   'change': 'Need approval',        'icon': 'CalendarOff'},
                {'title': 'Upcoming Leaves',    'value': str(approved_leaves), 'trend': 'neutral','change': 'Approved',             'icon': 'Calendar'},
                {'title': 'Payroll Processed',  'value': str(payroll_paid),    'trend': 'up',     'change': 'This month',           'icon': 'DollarSign'},
                {'title': 'Payroll Pending',    'value': str(payroll_pending), 'trend': 'down',   'change': 'Unprocessed',          'icon': 'Clock'},
            ],
            'revenueTrend': joins_trend,
            'taskDistribution': dept_chart,
            'recentLeaves': leave_list,
            'recentProjects': [],
            'pendingTasks': [],
        }

    # ------------------------------------------------------------------ Project Manager
    def _pm_data(self, user):
        today = datetime.date.today()
        my_projects = Project.objects.filter(project_manager=user)
        my_tasks    = Task.objects.filter(assignee__in=User.objects.filter(project_memberships__project__in=my_projects)).distinct()

        active   = my_projects.filter(status='in_progress').count()
        on_hold  = my_projects.filter(status='on_hold').count()
        completed= my_projects.filter(status='completed').count()
        overdue_tasks  = my_tasks.filter(due_date__lt=today).exclude(status='completed').count()
        my_own_tasks   = Task.objects.filter(assignee=user).exclude(status='completed')
        in_progress_t  = my_tasks.filter(status='in_progress').count()
        pending_t      = my_tasks.exclude(status='completed').count()
        done_t         = my_tasks.filter(status='completed').count()

        # Recent projects with progress
        recent_proj = my_projects.order_by('-created_at')[:6]
        recent_projects = [{'id': p.id, 'name': p.name, 'client': p.client.company_name if p.client else 'Internal', 'progress': p.progress, 'status': p.status, 'priority': p.priority} for p in recent_proj]

        # Pending tasks for my team
        urgent_tasks = Task.objects.filter(
            project__in=my_projects
        ).exclude(status='completed').select_related('assignee', 'project').order_by('due_date', '-priority')[:6]
        task_list = [{'id': t.id, 'title': t.title, 'project': t.project.name if t.project else 'General', 'priority': t.priority, 'dueDate': t.due_date.strftime('%b %d') if t.due_date else '—', 'assignee': t.assignee.get_full_name() if t.assignee else '—', 'status': t.status} for t in urgent_tasks]

        # Task distribution
        task_dist_qs = my_tasks.values('status').annotate(count=Count('status'))
        status_map = {'todo': 'To Do', 'in_progress': 'In Progress', 'review': 'Review', 'completed': 'Completed'}
        task_dist = [{'name': status_map.get(d['status'], d['status']), 'value': d['count']} for d in task_dist_qs]

        # Project completion trend
        proj_trend = [{'name': p.name[:12], 'value': p.progress} for p in my_projects.order_by('-progress')[:6]]

        return {
            'role': 'project_manager',
            'stats': [
                {'title': 'My Active Projects', 'value': str(active),        'trend': 'up',     'change': f'{my_projects.count()} total', 'icon': 'FolderKanban'},
                {'title': 'On Hold',            'value': str(on_hold),       'trend': 'down',   'change': 'Paused',                       'icon': 'Clock'},
                {'title': 'Completed',          'value': str(completed),     'trend': 'up',     'change': 'Done',                         'icon': 'CheckCircle2'},
                {'title': 'Team Tasks Open',    'value': str(pending_t),     'trend': 'neutral','change': f'{in_progress_t} in progress', 'icon': 'CheckSquare'},
                {'title': 'Overdue Tasks',      'value': str(overdue_tasks), 'trend': 'down',   'change': 'Past due',                     'icon': 'AlertCircle'},
                {'title': 'Tasks Completed',    'value': str(done_t),        'trend': 'up',     'change': 'By team',                      'icon': 'Target'},
            ],
            'revenueTrend': proj_trend,
            'taskDistribution': task_dist,
            'recentProjects': recent_projects,
            'pendingTasks': task_list,
        }

    # ------------------------------------------------------------------ Employee
    def _employee_data(self, user):
        today = datetime.date.today()
        my_tasks  = Task.objects.filter(assignee=user)
        todo_t    = my_tasks.filter(status='todo').count()
        in_prog_t = my_tasks.filter(status='in_progress').count()
        done_t    = my_tasks.filter(status='completed').count()
        overdue_t = my_tasks.filter(due_date__lt=today).exclude(status='completed').count()

        # Latest salary
        salary_info = {'net': '—', 'month': '—', 'status': '—'}
        leave_info  = {'casual': 0, 'sick': 0, 'earned': 0, 'pending': 0}
        today_att   = None
        try:
            from apps.hrm.models import Salary, LeaveRequest, Attendance
            emp = user.employee_profile
            latest_sal = Salary.objects.filter(employee=emp).order_by('-year', '-month').first()
            if latest_sal:
                import calendar
                salary_info = {'net': f'₹{float(latest_sal.net_salary):,.0f}', 'month': calendar.month_name[latest_sal.month], 'status': latest_sal.payment_status}
            leave_info = {
                'casual': emp.casual_leave_balance,
                'sick':   emp.sick_leave_balance,
                'earned': emp.earned_leave_balance,
                'pending': LeaveRequest.objects.filter(employee=emp, status='pending').count()
            }
            att = Attendance.objects.filter(employee=emp, date=today).first()
            if att:
                today_att = {'check_in': str(att.check_in) if att.check_in else None, 'check_out': str(att.check_out) if att.check_out else None, 'status': att.status, 'hours': float(att.hours_worked)}
        except Exception: pass

        # My next 5 tasks
        pending_tasks = my_tasks.exclude(status='completed').order_by('due_date', '-priority').select_related('project')[:5]
        task_list = [{'id': t.id, 'title': t.title, 'project': t.project.name if t.project else 'General', 'priority': t.priority, 'dueDate': t.due_date.strftime('%b %d') if t.due_date else '—', 'status': t.status} for t in pending_tasks]

        task_dist = [
            {'name': 'To Do',       'value': todo_t},
            {'name': 'In Progress', 'value': in_prog_t},
            {'name': 'Completed',   'value': done_t},
            {'name': 'Overdue',     'value': overdue_t},
        ]

        return {
            'role': 'employee',
            'stats': [
                {'title': 'My Tasks',      'value': str(my_tasks.count()), 'trend': 'neutral','change': f'{done_t} done',       'icon': 'CheckSquare'},
                {'title': 'In Progress',   'value': str(in_prog_t),        'trend': 'up',     'change': 'Active',               'icon': 'Clock'},
                {'title': 'Overdue',       'value': str(overdue_t),        'trend': 'down',   'change': 'Past due',             'icon': 'AlertCircle'},
                {'title': 'Latest Salary', 'value': salary_info['net'],    'trend': 'up',     'change': salary_info['month'],   'icon': 'DollarSign'},
                {'title': 'Casual Leave',  'value': str(leave_info['casual']),'trend': 'neutral','change': 'Remaining days',    'icon': 'Calendar'},
                {'title': 'Sick Leave',    'value': str(leave_info['sick']),  'trend': 'neutral','change': 'Remaining days',    'icon': 'Calendar'},
            ],
            'revenueTrend': [],
            'taskDistribution': task_dist,
            'recentProjects': [],
            'pendingTasks': task_list,
            'todayAttendance': today_att,
            'leaveBalance': leave_info,
            'salaryInfo': salary_info,
        }

    # ------------------------------------------------------------------ dispatch
    def get(self, request):
        user = request.user
        role = getattr(user, 'role', 'employee')
        try:
            if role == 'ceo':
                data = self._ceo_data()
            elif role == 'hr':
                data = self._hr_data()
            elif role == 'project_manager':
                data = self._pm_data(user)
            else:
                data = self._employee_data(user)
        except Exception as e:
            import traceback
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)
        return Response(data)



class ExportEmployeesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employees.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Email', 'Role', 'Department', 'Designation', 'Status'])

        users = User.objects.all()
        for user in users:
            writer.writerow([
                user.id,
                user.get_full_name(),
                user.email,
                user.role,
                user.department.name if user.department else '',
                user.designation.title if user.designation else '',
                'Active' if user.is_active else 'Inactive'
            ])

        return response

class ExportProjectsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="projects.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Client', 'Status', 'Start Date', 'End Date', 'Budget'])

        projects = Project.objects.all()
        for project in projects:
            writer.writerow([
                project.id,
                project.name,
                project.client.company_name if project.client else 'Internal',
                project.status,
                project.start_date,
                project.end_date,
                project.budget
            ])

        return response

class ExportInvoicesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="invoices.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Invoice Number', 'Client', 'Date', 'Due Date', 'Total Amount', 'Status'])

        invoices = Invoice.objects.all()
        for invoice in invoices:
            writer.writerow([
                invoice.id,
                invoice.invoice_number,
                invoice.client.company_name,
                invoice.issue_date,
                invoice.due_date,
                invoice.total,
                invoice.status
            ])

        return response
