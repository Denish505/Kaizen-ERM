from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, DepartmentViewSet, DesignationViewSet, SkillViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'designations', DesignationViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

from .views_password_reset import PasswordResetView, SetNewPasswordView
from .views_change_password import ChangePasswordView

urlpatterns = [
    # Custom endpoints (must come before router to avoid conflicts)
    path('users/change_password/', ChangePasswordView.as_view(), name='change_password'),
    path('password_reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password_reset_confirm/', SetNewPasswordView.as_view(), name='password_reset_confirm'),
    
    # Router endpoints
    path('', include(router.urls)),
]
