from rest_framework import serializers
from .models import Asset, AssetCategory, AssetMaintenance, SoftwareLicense, LicenseAssignment

class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'

class AssetMaintenanceSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by', read_only=True) # It's a char field but maybe store name there

    class Meta:
        model = AssetMaintenance
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    maintenance_records = AssetMaintenanceSerializer(many=True, read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'asset_id', 'name', 'category', 'category_name', 'description',
            'purchase_date', 'purchase_price', 'vendor', 'invoice_number', 'warranty_expiry',
            'current_value', 'status', 'condition', 'location', 
            'assigned_to', 'assigned_to_name', 'department', 'department_name',
            'serial_number', 'model_number', 'manufacturer', 'notes',
            'maintenance_records', 'created_at', 'updated_at'
        ]


class LicenseAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    license_name = serializers.CharField(source='license.name', read_only=True)
    
    class Meta:
        model = LicenseAssignment
        fields = ['id', 'license', 'license_name', 'user', 'user_name', 'assigned_date', 'revoked_date']


class SoftwareLicenseSerializer(serializers.ModelSerializer):
    assignments = LicenseAssignmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SoftwareLicense
        fields = '__all__'
