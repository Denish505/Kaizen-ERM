import { useState, useEffect } from 'react'
import { CreditCard, Plus, Search, Upload, DollarSign, TrendingDown, Receipt, Users, X, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { financeService } from '../../services/finance.service'
import { useAuth } from '../../App'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { getTodayIST } from '../../utils/dateUtils'

export default function Expenses() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [receiptFile, setReceiptFile] = useState(null)

    // Form data
    const [formData, setFormData] = useState({
        title: '', description: '', vendor: '', amount: '',
        category: '', date: getTodayIST()
    })

    useEffect(() => {
        fetchExpenses()
    }, [])

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const response = await financeService.getExpenses()
            setExpenses(response.data.results || response.data) // handle pagination if any
        } catch (err) {
            console.error("Error fetching expenses:", err)
        } finally {
            setLoading(false)
        }
    }

    const categories = [
        'Travel & Conveyance', 'Food & Meals', 'Office Supplies',
        'Software & Subscriptions', 'Hardware & Equipment', 'Utilities',
        'Marketing & Advertising', 'Training & Development',
        'Client Entertainment', 'Miscellaneous'
    ]

    const mapCategoryToKey = (cat) => {
        const map = {
            'Travel & Conveyance': 'travel', 'Food & Meals': 'food', 'Office Supplies': 'office',
            'Software & Subscriptions': 'software', 'Hardware & Equipment': 'hardware', 'Utilities': 'utilities',
            'Marketing & Advertising': 'marketing', 'Training & Development': 'training',
            'Client Entertainment': 'client', 'Miscellaneous': 'miscellaneous'
        }
        return map[cat] || 'miscellaneous'
    }

    const handleCreateExpense = async (e) => {
        e.preventDefault()
        try {
            const payload = new FormData()
            payload.append('title', formData.title)
            payload.append('description', formData.description)
            payload.append('vendor', formData.vendor)
            payload.append('amount', formData.amount)
            payload.append('category', mapCategoryToKey(formData.category))
            payload.append('date', formData.date)
            if (receiptFile) {
                payload.append('receipt', receiptFile)
            }

            await financeService.createExpense(payload)
            toast.success('Expense submitted successfully')
            setShowAddModal(false)
            setFormData({
                title: '', description: '', vendor: '', amount: '',
                category: '', date: getTodayIST()
            })
            setReceiptFile(null)
            fetchExpenses()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create expense')
        }
    }

    const handleApprove = async (id, e) => {
        e.stopPropagation()
        try {
            setExpenses(expenses.map(exp => exp.id === id ? { ...exp, status: 'approved' } : exp))
            await financeService.approveExpense(id)
            toast.success('Expense approved')
        } catch (err) {
            toast.error("Failed to approve expense")
            fetchExpenses()
        }
    }

    const handleReject = async (id, e) => {
        e.stopPropagation()
        const reason = prompt('Enter rejection reason:')
        if (!reason) return
        try {
            setExpenses(expenses.map(exp => exp.id === id ? { ...exp, status: 'rejected' } : exp))
            await financeService.rejectExpense(id, reason)
            toast.success('Expense rejected')
        } catch (err) {
            toast.error('Failed to reject expense')
            fetchExpenses()
        }
    }

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.vendor.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !categoryFilter || exp.category === mapCategoryToKey(categoryFilter)
        return matchesSearch && matchesCategory
    })

    const formatCurrency = (value) => {
        if (!value) return '₹0'
        return `₹${parseFloat(value).toLocaleString('en-IN')}`
    }

    const stats = {
        total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        count: expenses.length,
    }

    if (loading) return <div className="loading-state">Loading expenses...</div>

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expenses</h1>
                    <p className="page-subtitle">Track and manage company expenses</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Expense
                </button>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <CreditCard size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.total)}</div>
                    <div className="stat-card-label">Total Expenses</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <CheckCircle size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.approved)}</div>
                    <div className="stat-card-label">Approved</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <AlertTriangle size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.pending)}</div>
                    <div className="stat-card-label">Pending Approval</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <Receipt size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.count}</div>
                    <div className="stat-card-label">Claims</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Vendor</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-gray-50">
                                    <td>
                                        <p className="font-medium text-gray-900">{exp.title}</p>
                                        <p className="text-xs text-gray-500">{exp.date}</p>
                                    </td>
                                    <td className="text-gray-600">{exp.vendor}</td>
                                    <td><span className="badge badge-secondary">{exp.category}</span></td>
                                    <td className="font-bold text-gray-800">{formatCurrency(exp.amount)}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="avatar avatar-sm bg-primary-50 text-primary-700 text-xs">
                                                {exp.submitted_by_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm text-gray-600">{exp.submitted_by_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${exp.status === 'approved' ? 'badge-success' :
                                            exp.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                            {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {(exp.status === 'pending' && ['ceo', 'admin', 'finance_manager'].includes(user?.role)) && (
                                                <>
                                                    <button className="btn btn-sm btn-success text-white" onClick={(e) => handleApprove(exp.id, e)}>
                                                        Approve
                                                    </button>
                                                    <button className="btn btn-sm btn-danger text-white" onClick={(e) => handleReject(exp.id, e)}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {exp.receipt && (
                                                <a href={exp.receipt} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                                                    <FileText size={14} /> Receipt
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Expense">
                <form onSubmit={handleCreateExpense}>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input type="text" className="form-input" required placeholder="e.g. Flight to Delhi" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Vendor</label>
                            <input type="text" className="form-input" required placeholder="e.g. Indigo" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input type="number" className="form-input" required placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-input form-select" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Upload Receipt</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setReceiptFile(e.target.files[0])}
                                accept="image/*,.pdf"
                            />
                            <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                            {receiptFile ? (
                                <p className="text-primary-600 font-medium">{receiptFile.name}</p>
                            ) : (
                                <p className="text-gray-500 text-sm">Click to upload receipt</p>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button type="submit">Submit Claim</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
