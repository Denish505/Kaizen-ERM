from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.http import HttpResponse
from decimal import Decimal
import csv
from .models import Invoice, Expense, Payment, PurchaseOrder, Budget
from .serializers import (
    InvoiceSerializer, ExpenseSerializer, PaymentSerializer,
    PurchaseOrderSerializer, BudgetSerializer
)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('client', 'project').prefetch_related('items', 'payments')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # We might want to set created_by if we had it, but Invoice model doesn't explicitly have it in my recall, 
        # but typically yes. Assuming it does or we just save.
        serializer.save()

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        amount = request.data.get('amount')
        date = request.data.get('payment_date', timezone.now().date())
        method = request.data.get('payment_method', 'bank_transfer')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=400)
            
        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({'error': 'Invalid amount'}, status=400)
            
        if amount > invoice.balance_due:
            return Response({'error': 'Payment amount exceeds balance due'}, status=400)
            
        payment = Payment.objects.create(
            invoice=invoice,
            amount=amount,
            payment_date=date,
            payment_method=method,
            recorded_by=request.user,
            reference_number=request.data.get('reference_number', request.data.get('transaction_id', '')),
            notes=request.data.get('notes', '')
        )
        
        # Update invoice balance — all Decimal arithmetic
        invoice.amount_paid = invoice.amount_paid + amount
        invoice.balance_due = invoice.total - invoice.amount_paid
        if invoice.balance_due <= 0:
            invoice.status = 'paid'
        elif invoice.amount_paid > 0:
            invoice.status = 'partial'   # Model choice is 'partial', not 'partially_paid'
        invoice.save()
        
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'draft':
            invoice.status = 'sent'
            invoice.save()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        invoice = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.csv"'
        writer = csv.writer(response)
        writer.writerow(['Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Total', 'Balance Due', 'Status'])
        writer.writerow([
            invoice.invoice_number,
            invoice.client.company_name if invoice.client else '',
            invoice.issue_date,
            invoice.due_date,
            invoice.total,
            invoice.balance_due,
            invoice.status,
        ])
        if invoice.items.exists():
            writer.writerow([])
            writer.writerow(['Description', 'Quantity', 'Unit Price', 'Amount'])
            for item in invoice.items.all():
                writer.writerow([item.description, item.quantity, item.unit_price, item.amount])
        return response


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('submitted_by', 'department', 'project')
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ['ceo', 'admin', 'finance_manager'] and not request.user.is_superuser:
             return Response({'error': 'Permission denied'}, status=403)
             
        expense = self.get_object()
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.approved_on = timezone.now()
        expense.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role not in ['ceo', 'admin', 'finance_manager'] and not request.user.is_superuser:
             return Response({'error': 'Permission denied'}, status=403)
             
        expense = self.get_object()
        expense.status = 'rejected'
        expense.rejection_reason = request.data.get('reason', '')
        expense.save()
        return Response({'status': 'rejected'})


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'recorded_by')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('created_by').prefetch_related('items')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.select_related('department', 'project')
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
