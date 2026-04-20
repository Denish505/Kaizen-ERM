from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Client, Lead, ClientContact, Deal, Contract
from .serializers import (
    ClientSerializer, LeadSerializer, ClientContactSerializer,
    DealSerializer, ContractSerializer
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.prefetch_related('contacts')
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['post'])
    def add_contact(self, request, pk=None):
        client = self.get_object()
        serializer = ClientContactSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(client=client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage)
        return queryset
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.converted_to_client:
            return Response({'error': 'Lead already converted'}, status=400)
            
        # Create client from lead
        client = Client.objects.create(
            name=lead.name,
            company_name=lead.company,
            email=lead.email,
            phone=lead.phone,
            city=lead.city,
            account_manager=lead.assigned_to,
            status='active'
        )
        
        lead.stage = 'won'
        lead.converted_to_client = client
        lead.save()
        
        return Response(ClientSerializer(client).data)

    @action(detail=False, methods=['get'])
    def my_leads(self, request):
        leads = Lead.objects.filter(assigned_to=request.user).exclude(stage__in=['won', 'lost'])
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)


class ClientContactViewSet(viewsets.ModelViewSet):
    queryset = ClientContact.objects.all()
    serializer_class = ClientContactSerializer
    permission_classes = [IsAuthenticated]


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.select_related('client', 'assigned_to')
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # assign current user if assigned_to is not provided? Or leave it to input
        serializer.save()


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related('client')
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]
