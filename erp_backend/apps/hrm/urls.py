from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, AttendanceViewSet, LeaveTypeViewSet, 
    LeaveRequestViewSet, SalaryViewSet, HolidayViewSet, PerformanceReviewViewSet
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'leave-types', LeaveTypeViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'salaries', SalaryViewSet)
router.register(r'holidays', HolidayViewSet)
router.register(r'performance-reviews', PerformanceReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
