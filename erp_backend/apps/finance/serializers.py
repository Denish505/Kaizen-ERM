from rest_framework import serializers
from .models import Invoice, InvoiceItem, Expense, Payment, PurchaseOrder, POItem, Budget
from apps.projects.serializers import ProjectSerializer
from apps.clients.serializers import ClientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'hsn_code', 'quantity', 'unit_price', 'amount']
        read_only_fields = ['id', 'amount']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name', 'project', 'project_name',
            'issue_date', 'due_date', 'subtotal', 
            'cgst_rate', 'sgst_rate', 'igst_rate',
            'cgst_amount', 'sgst_amount', 'igst_amount',
            'total_tax', 'discount', 'total',
            'amount_paid', 'balance_due', 'status', 
            'notes', 'terms', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 
                            'cgst_amount', 'sgst_amount', 'igst_amount', 
                            'total_tax', 'total', 'balance_due']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        # Calculate totals
        subtotal = 0
        for item_data in items_data:
            # simple calculation
            amount = item_data['quantity'] * item_data['unit_price']
            subtotal += amount
            InvoiceItem.objects.create(invoice=invoice, amount=amount, **item_data)
            
        invoice.subtotal = subtotal
        # Recalculate tax
        cgst = (subtotal * invoice.cgst_rate) / 100
        sgst = (subtotal * invoice.sgst_rate) / 100
        igst = (subtotal * invoice.igst_rate) / 100
        invoice.cgst_amount = cgst
        invoice.sgst_amount = sgst
        invoice.igst_amount = igst
        invoice.total_tax = cgst + sgst + igst
        invoice.total = subtotal + invoice.total_tax - invoice.discount
        invoice.balance_due = invoice.total - invoice.amount_paid
        invoice.save()
        
        return invoice

class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'category', 'amount', 'date',
            'vendor', 'invoice_number', 'gst_amount',
            'submitted_by', 'submitted_by_name', 'department', 'department_name',
            'project', 'project_name', 'status', 
            'approved_by', 'approved_on', 'rejection_reason',
            'receipt', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'submitted_by', 'status', 'approved_by', 'approved_on', 'rejection_reason']


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'recorded_by']


class POItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = POItem
        fields = '__all__'
        read_only_fields = ['id', 'amount']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = POItemSerializer(many=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'vendor', 'issue_date', 'delivery_date',
            'subtotal', 'tax_amount', 'total', 'status', 'notes',
            'created_by', 'created_by_name', 'created_at', 'items'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'subtotal', 'total']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        po = PurchaseOrder.objects.create(**validated_data)
        
        subtotal = 0
        for item_data in items_data:
            amount = item_data['quantity'] * item_data['unit_price']
            subtotal += amount
            POItem.objects.create(po=po, amount=amount, **item_data)
            
        po.subtotal = subtotal
        po.total = subtotal + po.tax_amount
        po.save()
        return po


class BudgetSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'spent']

