from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentViewSet, DocumentFolderViewSet, 
    DocumentPermissionViewSet, DocumentTemplateViewSet
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet)
router.register(r'folders', DocumentFolderViewSet)
router.register(r'permissions', DocumentPermissionViewSet)
router.register(r'templates', DocumentTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
