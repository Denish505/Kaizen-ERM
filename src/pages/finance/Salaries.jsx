import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { DollarSign, Download, Search, TrendingUp, Users, Plus, Edit2, Trash2, ShieldOff } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Salaries() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [salaries, setSalaries] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedSalary, setSelectedSalary] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [employees, setEmployees] = useState([])

    const [formData, setFormData] = useState({
        employee: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        basic_salary: '', hra: '', da: '', other_allowances: '',
        pf_employee: '', tds: '', professional_tax: '', other_deductions: ''
    })

    const canView = ['ceo', 'stakeholder', 'hr', 'admin'].includes(user?.role)

    useEffect(() => {
        if (canView) {
            fetchData()
        }
    }, [canView])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [salRes, empRes] = await Promise.all([
                hrmService.getSalaries(),
                hrmService.getEmployees()
            ])
            setSalaries(salRes.data)
            setEmployees(empRes.data)
        } catch (err) {
            console.error("Error:", err)
            toast.error("Failed to load salary data")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            employee: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
            basic_salary: '', hra: '', da: '', other_allowances: '',
            pf_employee: '', tds: '', professional_tax: '', other_deductions: ''
        })
    }

    const handleAdd = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleEdit = (sal) => {
        setSelectedSalary(sal)
        setFormData({
            employee: sal.employee,
            month: sal.month,
            year: sal.year,
            basic_salary: sal.basic_salary || '',
            hra: sal.hra || '',
            da: sal.da || '',
            other_allowances: sal.other_allowances || '',
            pf_employee: sal.pf_employee || '',
            tds: sal.tds || '',
            professional_tax: sal.professional_tax || '',
            other_deductions: sal.other_deductions || ''
        })
        setShowEditModal(true)
    }

    const handleDelete = (sal) => {
        setSelectedSalary(sal)
        setShowDeleteConfirm(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await hrmService.createSalary(formData)
            toast.success('Salary record created!')
            setShowAddModal(false)
            resetForm()
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create salary record')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await hrmService.updateSalary(selectedSalary.id, formData)
            toast.success('Salary record updated!')
            setShowEditModal(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update salary record')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSubmitting(true)
        try {
            await hrmService.deleteSalary(selectedSalary.id)
            toast.success('Salary record deleted!')
            setShowDeleteConfirm(false)
            fetchData()
        } catch (err) {
            toast.error('Failed to delete salary record')
        } finally {
            setSubmitting(false)
        }
    }

    if (!canView) {
        return (
            <div className="animate-fadeIn">
                <div className="empty-state" style={{ marginTop: '4rem' }}>
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldOff size={40} style={{ color: 'var(--error)' }} />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
                        <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view salary information.</p>
                    </div>
                </div>
            </div>
        )
    }

    const filteredSalaries = salaries.filter(record =>
        record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPayroll = salaries.reduce((sum, e) => sum + parseFloat(e.net_salary || 0), 0)
    const avgSalary = salaries.length ? Math.round(totalPayroll / salaries.length) : 0
    const totalPF = salaries.reduce((sum, e) => sum + parseFloat(e.pf_employee || 0), 0)

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

    const SalaryForm = ({ onSubmit, submitText }) => (
        <form onSubmit={onSubmit}>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Employee</label>
                    <select className="form-input form-select" required value={formData.employee}
                        onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-input form-select" value={formData.month}
                        onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-input" value={formData.year}
                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Basic Salary (₹)</label>
                    <input type="number" className="form-input" required value={formData.basic_salary}
                        onChange={e => setFormData({ ...formData, basic_salary: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">HRA (₹)</label>
                    <input type="number" className="form-input" value={formData.hra}
                        onChange={e => setFormData({ ...formData, hra: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">DA (₹)</label>
                    <input type="number" className="form-input" value={formData.da}
                        onChange={e => setFormData({ ...formData, da: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Other Allowances (₹)</label>
                    <input type="number" className="form-input" value={formData.other_allowances}
                        onChange={e => setFormData({ ...formData, other_allowances: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">PF Employee (₹)</label>
                    <input type="number" className="form-input" value={formData.pf_employee}
                        onChange={e => setFormData({ ...formData, pf_employee: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">TDS (₹)</label>
                    <input type="number" className="form-input" value={formData.tds}
                        onChange={e => setFormData({ ...formData, tds: e.target.value })} />
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
                    <h1 className="page-title">Salaries</h1>
                    <p className="page-subtitle">Employee compensation management (₹ INR)</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" icon={Download}>Export</Button>
                    <Button icon={Plus} onClick={handleAdd}>Add Salary</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                <div className="stat-card hover-lift">
                    <div className="stat-card-icon success"><DollarSign size={24} /></div>
                    <div className="stat-card-value">₹{(totalPayroll / 100000).toFixed(1)}L</div>
                    <div className="stat-card-label">Total Monthly Payroll</div>
                </div>
                <div className="stat-card hover-lift">
                    <div className="stat-card-icon primary"><TrendingUp size={24} /></div>
                    <div className="stat-card-value">₹{(avgSalary / 1000).toFixed(1)}K</div>
                    <div className="stat-card-label">Average Net Salary</div>
                </div>
                <div className="stat-card hover-lift">
                    <div className="stat-card-icon info"><Users size={24} /></div>
                    <div className="stat-card-value">{salaries.length}</div>
                    <div className="stat-card-label">Total Records</div>
                </div>
                <div className="stat-card hover-lift">
                    <div className="stat-card-icon warning"><DollarSign size={24} /></div>
                    <div className="stat-card-value">₹{(totalPF / 1000).toFixed(1)}K</div>
                    <div className="stat-card-label">Total PF</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div className="header-search" style={{ maxWidth: '400px' }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search employees..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Salary Table */}
            <div className="glass-card">
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Period</th>
                                <th>Basic</th>
                                <th>HRA</th>
                                <th>PF</th>
                                <th>TDS</th>
                                <th>Net Salary</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSalaries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No salary records found</p>
                                        <Button variant="primary" icon={Plus} onClick={handleAdd} style={{ marginTop: '1rem' }}>
                                            Add First Salary Record
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                filteredSalaries.map((emp, idx) => (
                                    <tr key={emp.id} className="stagger-item">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm">{emp.employee_name?.split(' ').map(n => n[0]).join('')}</div>
                                                <div>
                                                    <span style={{ fontWeight: 500, display: 'block' }}>{emp.employee_name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.employee_id_display}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{emp.month}/{emp.year}</td>
                                        <td>₹{parseFloat(emp.basic_salary).toLocaleString()}</td>
                                        <td style={{ color: 'var(--success)' }}>₹{parseFloat(emp.hra || 0).toLocaleString()}</td>
                                        <td style={{ color: 'var(--warning)' }}>₹{parseFloat(emp.pf_employee || 0).toLocaleString()}</td>
                                        <td style={{ color: 'var(--error)' }}>₹{parseFloat(emp.tds || 0).toLocaleString()}</td>
                                        <td style={{ fontWeight: 600 }}>₹{parseFloat(emp.net_salary || 0).toLocaleString()}</td>
                                        <td>
                                            <div className="action-buttons" style={{ opacity: 1 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(emp)}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Salary Record" size="lg">
                <SalaryForm onSubmit={handleAddSubmit} submitText="Add Salary" />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Salary Record" size="lg">
                <SalaryForm onSubmit={handleEditSubmit} submitText="Save Changes" />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Salary Record?"
                message={`Are you sure you want to delete the salary record for "${selectedSalary?.employee_name}"?`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
