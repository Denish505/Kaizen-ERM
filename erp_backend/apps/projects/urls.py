from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, ProjectMemberViewSet, SprintViewSet, 
    MilestoneViewSet, TaskViewSet, TimesheetViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'members', ProjectMemberViewSet)
router.register(r'sprints', SprintViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'timesheets', TimesheetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
