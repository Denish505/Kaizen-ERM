from rest_framework import serializers
from .models import Client, Lead, ClientContact, Deal, Contract
from apps.users.serializers import UserMinimalSerializer

class ClientContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientContact
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    account_manager_name = serializers.CharField(source='account_manager.get_full_name', read_only=True)
    contacts = ClientContactSerializer(many=True, read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company_name', 'email', 'phone', 'alternate_phone',
            'address', 'city', 'state', 'pincode', 'country',
            'gstin', 'pan', 'industry', 'website',
            'status', 'total_revenue', 'account_manager', 'account_manager_name',
            'contacts', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    converted_client_name = serializers.CharField(source='converted_to_client.company_name', read_only=True)
    
    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'company', 'email', 'phone', 'city',
            'stage', 'source', 'expected_value', 'probability', 'expected_close_date',
            'assigned_to', 'assigned_to_name', 'notes',
            'converted_to_client', 'converted_client_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DealSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContractSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
    

