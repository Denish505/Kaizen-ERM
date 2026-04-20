from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Asset, AssetCategory, AssetMaintenance, SoftwareLicense, LicenseAssignment
from .serializers import (
    AssetSerializer, AssetCategorySerializer, AssetMaintenanceSerializer,
    SoftwareLicenseSerializer, LicenseAssignmentSerializer
)

class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related('category', 'assigned_to', 'department')
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        asset = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID required'}, status=400)
        
        # Logic to assign asset to user
        asset.assigned_to_id = user_id
        asset.status = 'in_use'
        asset.save()
        return Response({'status': 'assigned'})
    
    @action(detail=True, methods=['post'])
    def return_asset(self, request, pk=None):
        asset = self.get_object()
        asset.assigned_to = None
        asset.status = 'available'
        asset.save()
        return Response({'status': 'returned'})

class AssetMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = AssetMaintenance.objects.all()
    serializer_class = AssetMaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class SoftwareLicenseViewSet(viewsets.ModelViewSet):
    queryset = SoftwareLicense.objects.prefetch_related('assignments')
    serializer_class = SoftwareLicenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        license = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'User ID required'}, status=400)
            
        current_assignments = license.assignments.filter(revoked_date__isnull=True).count()
        if current_assignments >= license.seats:
            return Response({'error': 'No seats available'}, status=400)
            
        LicenseAssignment.objects.create(
            license=license,
            user_id=user_id,
            assigned_date=request.data.get('assigned_date', timezone.now().date())
        )
        return Response({'status': 'assigned'})


class LicenseAssignmentViewSet(viewsets.ModelViewSet):
    queryset = LicenseAssignment.objects.select_related('license', 'user')
    serializer_class = LicenseAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
