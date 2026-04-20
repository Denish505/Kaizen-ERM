"""
Projects app views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from .models import Project, ProjectMember, Sprint, Milestone, Task, Timesheet, TaskComment, TaskAttachment
from .serializers import (
    ProjectSerializer, ProjectMinimalSerializer, ProjectMemberSerializer,
    SprintSerializer, MilestoneSerializer, TaskSerializer, TaskMinimalSerializer,
    TimesheetSerializer, TaskCommentSerializer, TaskAttachmentSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project CRUD operations."""
    queryset = Project.objects.select_related('client', 'project_manager')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        client = self.request.query_params.get('client')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if client:
            queryset = queryset.filter(client_id=client)
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Get projects where current user is a member."""
        projects = Project.objects.filter(members__user=request.user)
        serializer = ProjectMinimalSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get project statistics."""
        project = self.get_object()
        tasks = project.tasks.all()
        return Response({
            'total_tasks': tasks.count(),
            'completed_tasks': tasks.filter(status='completed').count(),
            'in_progress_tasks': tasks.filter(status='in_progress').count(),
            'total_hours': project.tasks.aggregate(total=Sum('actual_hours'))['total'] or 0,
            'members': project.members.filter(is_active=True).count(),
            'progress': project.progress,
        })

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        
        if not user_id:
            return Response({'error': 'User ID is required'}, status=400)
            
        if ProjectMember.objects.filter(project=project, user_id=user_id, is_active=True).exists():
            return Response({'error': 'User is already a member'}, status=400)
            
        ProjectMember.objects.create(project=project, user_id=user_id, role=role)
        return Response({'status': 'Member added successfully'})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            member = ProjectMember.objects.get(project=project, user_id=user_id, is_active=True)
            member.is_active = False
            member.left_date = timezone.now().date()
            member.save()
            return Response({'status': 'Member removed successfully'})
        except ProjectMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)


class ProjectMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for ProjectMember CRUD operations."""
    queryset = ProjectMember.objects.select_related('project', 'user')
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project')
        if project:
            queryset = queryset.filter(project_id=project)
        return queryset


class SprintViewSet(viewsets.ModelViewSet):
    """ViewSet for Sprint CRUD operations."""
    queryset = Sprint.objects.select_related('project')
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project')
        if project:
            queryset = queryset.filter(project_id=project)
        return queryset


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Milestone CRUD operations."""
    queryset = Milestone.objects.select_related('project')
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project')
        if project:
            queryset = queryset.filter(project_id=project)
        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations."""
    queryset = Task.objects.select_related('project', 'assignee', 'created_by')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project')
        status_filter = self.request.query_params.get('status')
        assignee = self.request.query_params.get('assignee')
        
        if project:
            queryset = queryset.filter(project_id=project)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if assignee:
            queryset = queryset.filter(assignee_id=assignee)
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get all tasks assigned to current user (all statuses)."""
        tasks = Task.objects.select_related(
            'project', 'assignee', 'created_by'
        ).filter(assignee=request.user).order_by('due_date', '-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def assign_task(self, request):
        """HR/Managers can assign a task directly to an employee without needing a project."""
        if request.user.role not in ['ceo', 'hr', 'project_manager']:
            return Response({'error': 'Only HR, Managers or CEO can assign tasks'}, status=403)

        from apps.users.models import User
        data = request.data
        title = data.get('title', '').strip()
        assignee_id = data.get('assignee_id')

        if not title:
            return Response({'error': 'Task title is required'}, status=400)
        if not assignee_id:
            return Response({'error': 'assignee_id is required'}, status=400)

        try:
            assignee = User.objects.get(id=assignee_id)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        task = Task.objects.create(
            title=title,
            description=data.get('description', ''),
            assignee=assignee,
            created_by=request.user,
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            due_date=data.get('due_date') or None,
            start_date=data.get('start_date') or None,
            estimated_hours=data.get('estimated_hours', 0),
            project=None,
        )
        return Response(TaskSerializer(task).data, status=201)

    @action(detail=False, methods=['get'])
    def all_employee_tasks(self, request):
        """HR/CEO/PM: see all employee tasks with optional filters."""
        if request.user.role not in ['ceo', 'hr', 'project_manager']:
            return Response({'error': 'Permission denied'}, status=403)

        qs = Task.objects.select_related('project', 'assignee', 'created_by').all()
        assignee = request.query_params.get('assignee')
        task_status = request.query_params.get('status')
        priority = request.query_params.get('priority')

        if assignee:
            qs = qs.filter(assignee_id=assignee)
        if task_status:
            qs = qs.filter(status=task_status)
        if priority:
            qs = qs.filter(priority=priority)

        qs = qs.order_by('assignee__first_name', 'due_date', '-created_at')
        serializer = TaskSerializer(qs, many=True)
        return Response(serializer.data)

    def perform_update(self, serializer):
        task = self.get_object()
        old_status = task.status
        new_task = serializer.save()
        
        if old_status != new_task.status:
            if new_task.status == 'completed':
                new_task.completed_at = timezone.now()
            else:
                new_task.completed_at = None
            new_task.save(update_fields=['completed_at'])
            
            if new_task.project:
                total_tasks = new_task.project.tasks.count()
                if total_tasks > 0:
                    completed_tasks = new_task.project.tasks.filter(status='completed').count()
                    new_task.project.progress = int((completed_tasks / total_tasks) * 100)
                    new_task.project.save(update_fields=['progress'])
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Quick status update for a task."""
        task = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
        
        old_status = task.status
        task.status = new_status
        if new_status == 'completed':
            task.completed_at = timezone.now()
        else:
            task.completed_at = None
        task.save()
        
        if old_status != new_status and task.project:
            total_tasks = task.project.tasks.count()
            if total_tasks > 0:
                completed_tasks = task.project.tasks.filter(status='completed').count()
                task.project.progress = int((completed_tasks / total_tasks) * 100)
                task.project.save(update_fields=['progress'])

        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        serializer = TaskCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        task = self.get_object()
        comments = task.comments.all().order_by('-created_at')
        serializer = TaskCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        serializer = TaskAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        task = self.get_object()
        attachments = task.attachments.all().order_by('-uploaded_at')
        serializer = TaskAttachmentSerializer(attachments, many=True)
        return Response(serializer.data)


class TimesheetViewSet(viewsets.ModelViewSet):
    """ViewSet for Timesheet CRUD operations."""
    queryset = Timesheet.objects.select_related('task', 'task__project', 'user')
    serializer_class = TimesheetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.query_params.get('user')
        task = self.request.query_params.get('task')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if user:
            queryset = queryset.filter(user_id=user)
        if task:
            queryset = queryset.filter(task_id=task)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_timesheets(self, request):
        """Get current user's timesheets."""
        timesheets = Timesheet.objects.filter(user=request.user).order_by('-date')[:50]
        serializer = self.get_serializer(timesheets, many=True)
        return Response(serializer.data)
