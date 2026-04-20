import api from './api';

export const financeService = {
    // Invoices
    getInvoices: (params) => api.get('/finance/invoices/', { params }),
    getInvoice: (id) => api.get(`/finance/invoices/${id}/`),
    createInvoice: (data) => api.post('/finance/invoices/', data),
    updateInvoice: (id, data) => api.patch(`/finance/invoices/${id}/`, data),
    deleteInvoice: (id) => api.delete(`/finance/invoices/${id}/`),
    sendInvoice: (id) => api.post(`/finance/invoices/${id}/send/`),
    downloadInvoice: (id) => api.get(`/finance/invoices/${id}/download/`, { responseType: 'blob' }),

    // Expenses
    getExpenses: (params) => api.get('/finance/expenses/', { params }),
    getExpense: (id) => api.get(`/finance/expenses/${id}/`),
    createExpense: (data) => api.post('/finance/expenses/', data),
    updateExpense: (id, data) => api.patch(`/finance/expenses/${id}/`, data),
    deleteExpense: (id) => api.delete(`/finance/expenses/${id}/`),
    approveExpense: (id) => api.post(`/finance/expenses/${id}/approve/`),
    rejectExpense: (id, reason) => api.post(`/finance/expenses/${id}/reject/`, { reason }),

    // Payments
    getPayments: (params) => api.get('/finance/payments/', { params }),
    recordPayment: (invoiceId, data) => api.post(`/finance/invoices/${invoiceId}/record_payment/`, data),

    // Purchase Orders
    getPurchaseOrders: (params) => api.get('/finance/purchase-orders/', { params }),
    getPurchaseOrder: (id) => api.get(`/finance/purchase-orders/${id}/`),
    createPurchaseOrder: (data) => api.post('/finance/purchase-orders/', data),
    updatePurchaseOrder: (id, data) => api.patch(`/finance/purchase-orders/${id}/`, data),
    deletePurchaseOrder: (id) => api.delete(`/finance/purchase-orders/${id}/`),

    // Budgets
    getBudgets: (params) => api.get('/finance/budgets/', { params }),
    createBudget: (data) => api.post('/finance/budgets/', data),
    updateBudget: (id, data) => api.patch(`/finance/budgets/${id}/`, data),
    deleteBudget: (id) => api.delete(`/finance/budgets/${id}/`),
};
