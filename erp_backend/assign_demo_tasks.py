import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User
from apps.projects.models import Task, Project

emails = ['ceo@kaizen.com', 'hr@kaizen.com', 'pm@kaizen.com', 'pm1@kaizen.com', 'employee@kaizen.com', 'amit@kaizen.com']
users = User.objects.filter(email__in=emails)
projects = list(Project.objects.all()[:5])

if not projects:
    print("No projects exist. Create projects first.")
    exit()

task_templates = [
    {"title": "Review Q3 Marketing Strategy", "priority": "high", "status": "in_progress"},
    {"title": "Finalize Budget for Upcoming Quarter", "priority": "urgent", "status": "todo"},
    {"title": "Interview Candidates for Senior Dev Role", "priority": "medium", "status": "todo"},
    {"title": "Prepare Presentation for Board Meeting", "priority": "high", "status": "todo"},
    {"title": "Code Review: Authentication Module", "priority": "medium", "status": "in_progress"},
    {"title": "Update Client Contracts", "priority": "low", "status": "review"},
    {"title": "Fix Critical Bug in Production", "priority": "urgent", "status": "in_progress"},
    {"title": "Weekly Team Sync Preparation", "priority": "low", "status": "completed"},
    {"title": "Optimize Database Queries", "priority": "high", "status": "review"},
    {"title": "Draft Performance Evaluation Forms", "priority": "medium", "status": "todo"},
]

today = timezone.now().date()

for user in users:
    tasks_to_create = 5
    print(f"Assigning {tasks_to_create} tasks to {user.first_name} ({user.email})...")
    
    for i in range(tasks_to_create):
        template = random.choice(task_templates)
        proj = random.choice(projects) if random.random() > 0.3 else None
        
        due_date = today + timedelta(days=random.randint(-2, 10))
        
        Task.objects.create(
            title=f"{template['title']} - {user.first_name}",
            description=f"Automated task assigned for demo purposes.",
            project=proj,
            assignee=user,
            created_by=User.objects.first(),
            status=template['status'],
            priority=template['priority'],
            start_date=today - timedelta(days=random.randint(1, 5)),
            due_date=due_date,
            estimated_hours=random.randint(2, 20),
            actual_hours=random.randint(1, 10) if template['status'] in ['in_progress', 'review', 'completed'] else 0
        )

print("Tasks successfully assigned to all demo users!")
