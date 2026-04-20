from django.urls import path
from .views import ExportEmployeesView, ExportProjectsView, ExportInvoicesView, AnalyticsDashboardView, DashboardView

urlpatterns = [
    path('employees/export/', ExportEmployeesView.as_view(), name='export_employees'),
    path('projects/export/', ExportProjectsView.as_view(), name='export_projects'),
    path('invoices/export/', ExportInvoicesView.as_view(), name='export_invoices'),
    path('analytics/overview/', AnalyticsDashboardView.as_view(), name='analytics_overview'),
    path('dashboard/overview/', DashboardView.as_view(), name='dashboard_overview'),
]
