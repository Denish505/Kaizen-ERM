"""
Projects app serializers.
"""
from rest_framework import serializers
from .models import Project, ProjectMember, Sprint, Milestone, Task, Timesheet, TaskComment, TaskAttachment
from apps.users.serializers import UserMinimalSerializer


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'code', 'description', 'client', 'client_name',
            'status', 'priority', 'start_date', 'end_date', 'deadline',
            'budget', 'spent', 'project_manager', 'project_manager_name',
            'department', 'department_name', 'progress', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectMinimalSerializer(serializers.ModelSerializer):
    """Minimal project serializer."""
    class Meta:
        model = Project
        fields = ['id', 'name', 'code', 'status']


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for ProjectMember model."""
    user_details = UserMinimalSerializer(source='user', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'project_name', 'user', 'user_details', 
                  'role', 'hourly_rate', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class SprintSerializer(serializers.ModelSerializer):
    """Serializer for Sprint model."""
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Sprint
        fields = ['id', 'project', 'project_name', 'name', 'goal', 
                  'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for Milestone model."""
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Milestone
        fields = ['id', 'project', 'project_name', 'name', 'description',
                  'due_date', 'is_completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_name', 'user_avatar', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'file', 'description', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    project_name = serializers.SerializerMethodField()
    project_code = serializers.SerializerMethodField()
    assignee_details = UserMinimalSerializer(source='assignee', read_only=True)
    created_by_details = UserMinimalSerializer(source='created_by', read_only=True)
    assignee_name = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_project_code(self, obj):
        return obj.project.code if obj.project else None

    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() if obj.assignee else None

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'project_code',
            'title', 'description', 'status', 'priority',
            'assignee', 'assignee_name', 'assignee_details', 'created_by', 'created_by_details',
            'estimated_hours', 'actual_hours', 'start_date', 'due_date',
            'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'project': {'required': False, 'allow_null': True},
        }


class TaskMinimalSerializer(serializers.ModelSerializer):
    """Minimal task serializer."""
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'priority', 'assignee', 'due_date']


class TimesheetSerializer(serializers.ModelSerializer):
    """Serializer for Timesheet model."""
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Timesheet
        fields = ['id', 'task', 'task_title', 'project_name', 'user', 'user_name',
                  'date', 'hours', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
