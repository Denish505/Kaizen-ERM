from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssetViewSet, AssetCategoryViewSet, AssetMaintenanceViewSet,
    SoftwareLicenseViewSet, LicenseAssignmentViewSet
)

router = DefaultRouter()
router.register(r'assets', AssetViewSet)
router.register(r'categories', AssetCategoryViewSet)
router.register(r'maintenance', AssetMaintenanceViewSet)
router.register(r'licenses', SoftwareLicenseViewSet)
router.register(r'license-assignments', LicenseAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
