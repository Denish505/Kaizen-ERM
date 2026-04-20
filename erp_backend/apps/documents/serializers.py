from rest_framework import serializers
from .models import Document, DocumentFolder, DocumentPermission, DocumentTemplate

class DocumentFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentFolder
        fields = '__all__'

class DocumentPermissionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    granted_by_name = serializers.CharField(source='granted_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentPermission
        fields = '__all__'
        read_only_fields = ['granted_by', 'granted_at']

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    permissions = DocumentPermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'file_size']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'
