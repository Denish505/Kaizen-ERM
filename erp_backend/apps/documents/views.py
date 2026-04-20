from rest_framework import viewsets, permissions, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, DocumentFolder, DocumentPermission, DocumentTemplate
from .serializers import (
    DocumentSerializer, DocumentFolderSerializer, 
    DocumentPermissionSerializer, DocumentTemplateSerializer
)

class DocumentFolderViewSet(viewsets.ModelViewSet):
    queryset = DocumentFolder.objects.all()
    serializer_class = DocumentFolderSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related('folder', 'uploaded_by').prefetch_related('permissions')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        extra = {'uploaded_by': self.request.user}
        if file:
            extra['file_size'] = file.size
            # Use filename as title if client didn't supply one
            if not self.request.data.get('title'):
                extra['title'] = file.name
        serializer.save(**extra)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        document = self.get_object()
        user_id = request.data.get('user_id')
        permission_level = request.data.get('permission', 'view')
        
        if not user_id:
            return Response({'error': 'User ID required'}, status=400)
            
        try:
            permission = DocumentPermission.objects.get(document=document, user_id=user_id)
            permission.permission_level = permission_level
            permission.save()
        except DocumentPermission.DoesNotExist:
            DocumentPermission.objects.create(
                document=document,
                user_id=user_id,
                permission_level=permission_level,
                granted_by=request.user
            )
            
        return Response({'status': 'Document shared'})


class DocumentPermissionViewSet(viewsets.ModelViewSet):
    queryset = DocumentPermission.objects.select_related('document', 'user')
    serializer_class = DocumentPermissionSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
