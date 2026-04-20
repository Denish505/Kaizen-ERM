"""
Management command: seed_employee_tasks
Creates realistic tasks for every active employee in the system.
"""
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.hrm.models import Employee
from apps.projects.models import Task


TASK_TEMPLATES = [
    # title, description, priority, status_weights
    ("Complete Q1 performance self-assessment",
     "Fill in the self-assessment form on the HR portal covering goals, achievements, and areas of improvement.",
     "high", ["todo", "in_progress", "completed"]),

    ("Review and update documentation",
     "Review existing SOPs and update them to reflect the latest process changes in your department.",
     "medium", ["todo", "in_progress", "review"]),

    ("Attend mandatory compliance training",
     "Complete the annual compliance and data-privacy training module. Certificate due by end of month.",
     "urgent", ["todo", "in_progress", "completed"]),

    ("Submit timesheet for the week",
     "Ensure all work logs and billable hours have been submitted in the system before Friday EOD.",
     "medium", ["in_progress", "completed"]),

    ("Onboard new team member",
     "Help the new joiner get access to tools, introduce them to the team, and walk them through the process.",
     "high", ["todo", "in_progress"]),

    ("Prepare monthly status report",
     "Compile work items completed this month, blockers faced, and plans for next month into a summary report.",
     "high", ["todo", "in_progress", "review"]),

    ("Code review for feature branch",
     "Review the pull request raised by the team and provide constructive feedback.",
     "medium", ["todo", "in_progress", "review", "completed"]),

    ("Set up development environment for new project",
     "Install dependencies, configure environment variables, and verify the local setup is working for the new module.",
     "medium", ["todo", "in_progress", "completed"]),

    ("Follow up on pending client deliverables",
     "Contact the client about the pending sign-off and provide ETA for remaining deliverables.",
     "urgent", ["todo", "in_progress"]),

    ("Update project tracker with latest milestones",
     "Reflect current progress, completed milestones, and upcoming deadlines in the project tracker.",
     "low", ["todo", "in_progress", "completed"]),

    ("Conduct team standup",
     "Run the daily standup meeting and capture blockers and action items.",
     "low", ["completed"]),

    ("Prepare demo for stakeholders",
     "Create a demo script and slides for the upcoming stakeholder presentation.",
     "high", ["todo", "in_progress", "review"]),

    ("Resolve production bug",
     "Investigate, fix and deploy the fix for the production issue reported by the client.",
     "urgent", ["in_progress", "review", "completed"]),

    ("Update leave and attendance records",
     "Verify your attendance records for the month and apply for any pending leave adjustments.",
     "low", ["todo", "completed"]),

    ("Coordinate with finance for expense reimbursement",
     "Submit all expense receipts and follow up with finance for the pending reimbursement claim.",
     "medium", ["todo", "in_progress"]),
]


def random_due_date(days_ahead_min=3, days_ahead_max=30):
    return date.today() + timedelta(days=random.randint(days_ahead_min, days_ahead_max))


class Command(BaseCommand):
    help = 'Seed realistic tasks for every active employee'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tasks-per-employee',
            type=int,
            default=4,
            help='Number of tasks to create per employee (default: 4)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing standalone tasks (no project) before seeding',
        )

    def handle(self, *args, **options):
        tasks_per = options['tasks_per_employee']

        if options['clear']:
            deleted, _ = Task.objects.filter(project__isnull=True).delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing standalone tasks.'))

        employees = Employee.objects.select_related('user').filter(user__is_active=True)
        if not employees.exists():
            self.stdout.write(self.style.ERROR('No active employees found. Run populate scripts first.'))
            return

        total_created = 0
        for emp in employees:
            # Pick random unique task templates for this employee
            selected = random.sample(TASK_TEMPLATES, min(tasks_per, len(TASK_TEMPLATES)))
            for title, description, priority, statuses in selected:
                chosen_status = random.choice(statuses)
                due = random_due_date() if chosen_status != 'completed' else (
                    date.today() - timedelta(days=random.randint(1, 14))
                )
                task = Task.objects.create(
                    title=title,
                    description=description,
                    assignee=emp.user,
                    created_by=emp.user,   # self-assigned for seed; HR can reassign
                    status=chosen_status,
                    priority=priority,
                    due_date=due,
                    start_date=date.today() - timedelta(days=random.randint(0, 7)),
                    project=None,
                )
                total_created += 1
                self.stdout.write(
                    f'  [{chosen_status.upper():12s}] {emp.employee_id} — {title[:55]}'
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Created {total_created} tasks across {employees.count()} employees.'
        ))
