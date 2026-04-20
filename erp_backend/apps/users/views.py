from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Department, Designation, Skill
from .serializers import (
    UserSerializer, UserMinimalSerializer, UserCreateSerializer,
    UserSerializer, UserMinimalSerializer, UserCreateSerializer,
    DepartmentSerializer, DesignationSerializer, SkillSerializer
)
from apps.projects.models import Project, Task
from apps.hrm.models import LeaveRequest, Employee
from apps.finance.models import Invoice
from django.db.models import Count, Q, Sum
from django.utils import timezone

User = get_user_model()


class IsHROrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ceo', 'hr', 'stakeholder']


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action == 'list_minimal':
            return UserMinimalSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHROrAdmin()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def list_minimal(self, request):
        users = self.get_queryset()
        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_role(self, request):
        role = request.query_params.get('role', None)
        if role:
            users = self.get_queryset().filter(role=role)
        else:
            users = self.get_queryset()
        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
        from PIL import Image
        from io import BytesIO
        from django.core.files.uploadedfile import InMemoryUploadedFile
        import sys
        
        user = request.user
        if 'avatar' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File too large. Maximum size is 5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Resize image to 200x200 max
        try:
            img = Image.open(avatar_file)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize maintaining aspect ratio
            max_size = (200, 200)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)
            
            # Create new file
            resized_file = InMemoryUploadedFile(
                output, 'ImageField',
                f"{avatar_file.name.rsplit('.', 1)[0]}.jpg",
                'image/jpeg',
                sys.getsizeof(output),
                None
            )
        except Exception as e:
            return Response({'error': f'Failed to process image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old avatar if exists
        if user.avatar_image:
            user.avatar_image.delete(save=False)
        
        # Save resized avatar
        user.avatar_image = resized_file
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHROrAdmin()]
        return [permissions.IsAuthenticated()]


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [permissions.IsAuthenticated]


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        role = user.role
        data = {
            'stats': self.get_stats(user, role),
            'recent_projects': self.get_recent_projects(user, role),
            'recent_activities': [],  # To be implemented with an Activity Log if needed
            'pending_tasks': self.get_pending_tasks(user),
        }
        return Response(data)

    def get_stats(self, user, role):
        # Default stats structure
        stats = []
        
        if role == 'ceo':
            today = timezone.now().date()
            monthly_revenue = Invoice.objects.filter(
                issue_date__year=today.year,
                issue_date__month=today.month,
                status='paid'
            ).aggregate(total=Sum('total'))['total'] or 0
            if monthly_revenue >= 10000000:
                rev_str = f'\u20b9{monthly_revenue/10000000:.1f}Cr'
            elif monthly_revenue >= 100000:
                rev_str = f'\u20b9{monthly_revenue/100000:.1f}L'
            else:
                rev_str = f'\u20b9{monthly_revenue:,.0f}'
            growth = Project.objects.filter(status='completed').count()
            stats = [
                {'title': 'Total Employees', 'value': User.objects.count(), 'change': '+0', 'trend': 'up', 'color': 'primary'},
                {'title': 'Active Projects', 'value': Project.objects.filter(status='in_progress').count(), 'change': '+0', 'trend': 'up', 'color': 'success'},
                {'title': 'Monthly Revenue', 'value': rev_str, 'change': '+0%', 'trend': 'up', 'color': 'warning'},
                {'title': 'Completed Projects', 'value': growth, 'change': '+0', 'trend': 'up', 'color': 'info'},
            ]
        elif role == 'project_manager':
            my_projects_count = Project.objects.filter(members__user=user).distinct().count()
            team_count = User.objects.filter(projectmember__project__members__user=user).distinct().count()
            stats = [
                {'title': 'My Projects', 'value': my_projects_count, 'change': '+0', 'trend': 'up', 'color': 'primary'},
                {'title': 'Team Members', 'value': team_count, 'change': '+0', 'trend': 'up', 'color': 'success'},
                {'title': 'Tasks in Progress', 'value': Task.objects.filter(project__members__user=user, status='in_progress').count(), 'change': '+0', 'trend': 'up', 'color': 'warning'},
                {'title': 'Completed Tasks', 'value': Task.objects.filter(project__members__user=user, status='completed').count(), 'change': '+0', 'trend': 'up', 'color': 'info'},
            ]
        elif role == 'hr':
            stats = [
                {'title': 'Total Employees', 'value': User.objects.count(), 'change': '+0', 'trend': 'up', 'color': 'primary'},
                {'title': 'Open Positions', 'value': '12', 'change': '-3', 'trend': 'down', 'color': 'warning'}, # Mock
                {'title': 'Leave Requests', 'value': LeaveRequest.objects.filter(status='pending').count(), 'change': '+0', 'trend': 'up', 'color': 'info'},
                {'title': 'Attendance Today', 'value': '94%', 'change': '+0%', 'trend': 'up', 'color': 'success'}, # Mock
            ]
        else: # employee
            try:
                emp = Employee.objects.get(user=user)
                leave_bal = 18 # Mock or fetch from leave balance model
            except:
                leave_bal = 0
            
            stats = [
                {'title': 'My Tasks', 'value': Task.objects.filter(assignee=user, status__in=['todo', 'in_progress']).count(), 'change': '+0', 'trend': 'up', 'color': 'primary'},
                {'title': 'In Progress', 'value': Task.objects.filter(assignee=user, status='in_progress').count(), 'change': '0', 'trend': 'up', 'color': 'warning'},
                {'title': 'Completed', 'value': Task.objects.filter(assignee=user, status='completed').count(), 'change': '+0', 'trend': 'up', 'color': 'success'},
                {'title': 'Leave Balance', 'value': leave_bal, 'change': '-0', 'trend': 'down', 'color': 'info'},
            ]
        
        return stats

    def get_recent_projects(self, user, role):
        if role in ['ceo', 'stakeholder', 'hr']:
            projects = Project.objects.all().order_by('-start_date')[:5]
        else:
            projects = Project.objects.filter(members__user=user).order_by('-start_date')[:5]
        
        data = []
        for p in projects:
            data.append({
                'id': p.id,
                'name': p.name,
                'client': p.client.company_name if p.client else 'Internal',
                'progress': p.progress,
                'status': p.status,
                'budget': '₹' + str(p.budget) if p.budget else 'N/A'
            })
        return data

    def get_pending_tasks(self, user):
        tasks = Task.objects.filter(assignee=user).exclude(status='completed').order_by('due_date')[:5]
        data = []
        for t in tasks:
            data.append({
                'id': t.id,
                'title': t.title,
                'project': t.project.name if t.project else 'No Project',
                'priority': t.priority,
                'dueDate': t.due_date.strftime('%Y-%m-%d') if t.due_date else 'No Date'
            })
        return data
