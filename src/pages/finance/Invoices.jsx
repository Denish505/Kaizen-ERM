import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Download, DollarSign, Filter, Edit2, Trash2, Send } from 'lucide-react'
import { financeService } from '../../services/finance.service'
import { clientsService } from '../../services/clients.service'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { getTodayIST } from '../../utils/dateUtils'

export default function Invoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [clients, setClients] = useState([])

    const [formData, setFormData] = useState({
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        client: '', issue_date: getTodayIST(), due_date: '',
        subtotal: '', items: []
    })

    const [paymentData, setPaymentData] = useState({
        amount: '', payment_date: getTodayIST(),
        payment_method: 'bank_transfer', reference_number: ''
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [invRes, clientRes] = await Promise.all([
                financeService.getInvoices(),
                clientsService.getClients()
            ])
            setInvoices(invRes.data)
            setClients(clientRes.data)
        } catch (err) {
            console.error("Error fetching:", err)
            toast.error("Failed to load invoices")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            client: '', issue_date: getTodayIST(), due_date: '',
            subtotal: '', items: []
        })
    }

    const handleAdd = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleEdit = (inv) => {
        setSelectedInvoice(inv)
        setFormData({
            invoice_number: inv.invoice_number,
            client: inv.client || '',
            issue_date: inv.issue_date,
            due_date: inv.due_date,
            subtotal: inv.subtotal || inv.total || '',
            items: inv.items || []
        })
        setShowEditModal(true)
    }

    const handleDelete = (inv) => {
        setSelectedInvoice(inv)
        setShowDeleteConfirm(true)
    }

    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv)
        setPaymentData({ ...paymentData, amount: inv.balance_due })
        setShowPaymentModal(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await financeService.createInvoice({
                ...formData,
                items: [{ description: 'Services', quantity: 1, unit_price: formData.subtotal || 0, amount: formData.subtotal || 0 }]
            })
            toast.success('Invoice created successfully!')
            setShowAddModal(false)
            resetForm()
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create invoice')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await financeService.updateInvoice(selectedInvoice.id, {
                ...formData,
                items: [{ description: 'Services', quantity: 1, unit_price: formData.subtotal || 0, amount: formData.subtotal || 0 }]
            })
            toast.success('Invoice updated successfully!')
            setShowEditModal(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update invoice')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSubmitting(true)
        try {
            await financeService.deleteInvoice(selectedInvoice.id)
            toast.success('Invoice deleted successfully!')
            setShowDeleteConfirm(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete invoice')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRecordPayment = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await financeService.recordPayment(selectedInvoice.id, {
                ...paymentData,
                amount: parseFloat(paymentData.amount)
            })
            toast.success('Payment recorded successfully!')
            setShowPaymentModal(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to record payment')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSendInvoice = async (inv) => {
        try {
            await financeService.sendInvoice(inv.id)
            toast.success('Invoice sent to client!')
            fetchData()
        } catch (err) {
            toast.error('Failed to send invoice')
        }
    }

    const handleDownload = async (inv) => {
        try {
            const response = await financeService.downloadInvoice(inv.id)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${inv.invoice_number}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Invoice downloaded!')
        } catch (err) {
            toast.error('Failed to download invoice')
        }
    }

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.client_name && inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = !statusFilter || inv.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '-'
        return `₹${parseFloat(value).toLocaleString('en-IN')}`
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return 'badge-success'
            case 'sent': return 'badge-info'
            case 'overdue': return 'badge-danger'
            case 'partial': return 'badge-warning'       // actual model value
            case 'partially_paid': return 'badge-warning' // legacy fallback
            default: return 'badge-secondary'
        }
    }

    const stats = {
        total: invoices.length,
        received: invoices.reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.balance_due || 0)), 0),
        pending: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0),
        overdue: invoices.filter(i => i.status === 'overdue').length
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header">
                    <div className="skeleton skeleton-title" style={{ width: '200px' }} />
                </div>
                <SkeletonCard count={4} />
            </div>
        )
    }

    const InvoiceForm = ({ onSubmit, submitText }) => (
        <form onSubmit={onSubmit}>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Client</label>
                    <select className="form-input form-select" required value={formData.client}
                        onChange={e => setFormData({ ...formData, client: e.target.value })}>
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input type="text" className="form-input" required value={formData.invoice_number}
                        onChange={e => setFormData({ ...formData, invoice_number: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-input" required value={formData.subtotal}
                        onChange={e => setFormData({ ...formData, subtotal: e.target.value })} placeholder="Total Amount" />
                </div>
                <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input type="date" className="form-input" required value={formData.issue_date}
                        onChange={e => setFormData({ ...formData, issue_date: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" required value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                <Button variant="secondary" type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>{submitText}</Button>
            </div>
        </form>
    )

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="page-subtitle">{filteredInvoices.length} invoices generated</p>
                </div>
                <Button icon={Plus} onClick={handleAdd}>Create Invoice</Button>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <FileText size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.total}</div>
                    <div className="stat-card-label">Total Invoices</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.received)}</div>
                    <div className="stat-card-label">Received</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.pending)}</div>
                    <div className="stat-card-label">Pending</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                            <Filter size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.overdue}</div>
                    <div className="stat-card-label">Overdue</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search invoices..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ width: 'auto', minWidth: '150px' }}
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="partial">Partially Paid</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card">
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((inv, idx) => (
                                <tr key={inv.id} className="stagger-item">
                                    <td style={{ fontFamily: 'monospace', color: 'var(--primary-400)', fontWeight: 500 }}>{inv.invoice_number}</td>
                                    <td style={{ fontWeight: 500 }}>{inv.client_name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{inv.issue_date}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{inv.due_date}</td>
                                    <td style={{ fontWeight: 500 }}>{formatCurrency(inv.total)}</td>
                                    <td style={{ color: parseFloat(inv.balance_due) > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                                        {parseFloat(inv.balance_due) > 0 ? formatCurrency(inv.balance_due) : '-'}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(inv.status)}`}>
                                            {inv.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{ opacity: 1 }}>
                                            {parseFloat(inv.balance_due) > 0 && (
                                                <button className="btn btn-sm btn-success" title="Record Payment" onClick={() => openPaymentModal(inv)}>
                                                    <DollarSign size={14} />
                                                </button>
                                            )}
                                            <button className="btn btn-sm btn-secondary" title="Send" onClick={() => handleSendInvoice(inv)}>
                                                <Send size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-secondary" title="Download" onClick={() => handleDownload(inv)}>
                                                <Download size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => handleEdit(inv)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(inv)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Invoice" size="md">
                <InvoiceForm onSubmit={handleAddSubmit} submitText="Create Invoice" />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Invoice" size="md">
                <InvoiceForm onSubmit={handleEditSubmit} submitText="Save Changes" />
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--info-bg)' }}>
                    <p style={{ fontSize: '0.9rem' }}>
                        Recording payment for <strong>{selectedInvoice?.invoice_number}</strong><br />
                        Balance Due: <strong style={{ color: 'var(--error)' }}>{formatCurrency(selectedInvoice?.balance_due)}</strong>
                    </p>
                </div>
                <form onSubmit={handleRecordPayment}>
                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input type="number" className="form-input" required max={selectedInvoice?.balance_due}
                            value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Payment Date</label>
                        <input type="date" className="form-input" required value={paymentData.payment_date}
                            onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select className="form-input form-select" value={paymentData.payment_method}
                            onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="cheque">Cheque</option>
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reference / Transaction ID (Optional)</label>
                        <input type="text" className="form-input" value={paymentData.reference_number}
                            onChange={e => setPaymentData({ ...paymentData, reference_number: e.target.value })} />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button variant="success" type="submit" loading={submitting}>Record Payment</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Invoice?"
                message={`Are you sure you want to delete invoice "${selectedInvoice?.invoice_number}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
