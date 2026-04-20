import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Building2, Users, MapPin, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Departments() {
    const { user } = useAuth()
    const [departments, setDepartments] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [editingDept, setEditingDept] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: '', code: '', head: '', location: 'Mumbai', budget: ''
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const [deptRes, empRes] = await Promise.all([
                hrmService.getDepartments(),
                hrmService.getEmployees()
            ])
            setDepartments(deptRes.data)
            setEmployees(empRes.data)
        } catch (err) {
            toast.error("Failed to load departments")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({ name: '', code: '', head: '', location: 'Mumbai', budget: '' })
        setEditingDept(null)
    }

    const handleAdd = () => { resetForm(); setShowModal(true) }
    const handleEdit = (dept) => {
        setEditingDept(dept)
        setFormData({
            name: dept.name, code: dept.code, head: dept.head || '',
            location: dept.location || 'Mumbai', budget: dept.budget || ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingDept) {
                await hrmService.updateDepartment(editingDept.id, formData)
                toast.success('Department updated!')
            } else {
                await hrmService.createDepartment(formData)
                toast.success('Department created!')
            }
            setShowModal(false)
            resetForm()
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Operation failed')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        setSubmitting(true)
        try {
            await hrmService.deleteDepartment(editingDept.id)
            toast.success('Department deleted!')
            setShowDeleteConfirm(false)
            fetchData()
        } catch (err) {
            toast.error('Failed to delete department')
        } finally {
            setSubmitting(false)
        }
    }

    const totalEmployees = departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)
    const totalBudget = departments.reduce((sum, d) => sum + parseFloat(d.budget || 0), 0)
    const canManage = ['ceo', 'hr', 'admin'].includes(user?.role)

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header"><div className="skeleton skeleton-title" style={{ width: '200px' }} /></div>
                <SkeletonCard count={4} />
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Departments</h1>
                    <p className="page-subtitle">{departments.length} departments across India</p>
                </div>
                {canManage && (
                    <Button icon={Plus} onClick={handleAdd}>Add Department</Button>
                )}
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Building2 size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{departments.length}</div>
                    <div className="stat-card-label">Total Departments</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{totalEmployees}</div>
                    <div className="stat-card-label">Total Employees</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <MapPin size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{[...new Set(departments.map(d => d.location))].length}</div>
                    <div className="stat-card-label">Locations</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">₹{(totalBudget / 100000).toFixed(1)}L</div>
                    <div className="stat-card-label">Total Budget</div>
                </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-3" style={{ gap: '1.25rem' }}>
                {departments.length === 0 ? (
                    <div className="glass-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>
                        <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No departments found</p>
                        {canManage && <Button icon={Plus} onClick={handleAdd}>Add First Department</Button>}
                    </div>
                ) : departments.map((dept, idx) => (
                    <div key={dept.id} className="glass-card hover-lift stagger-item" style={{ '--index': idx }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.1rem' }}>{dept.name}</h3>
                                <span className="badge badge-primary">{dept.code}</span>
                            </div>
                            {canManage && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-sm btn-secondary btn-icon" onClick={() => handleEdit(dept)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => { setEditingDept(dept); setShowDeleteConfirm(true) }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <div className="dept-info-row">
                                <Users size={16} />
                                <span className="dept-info-label">Head:</span>
                                <span className="dept-info-value">{employees.find(e => e.id === dept.head) ? `${employees.find(e => e.id === dept.head).first_name} ${employees.find(e => e.id === dept.head).last_name}` : 'Vacant'}</span>
                            </div>
                            <div className="dept-info-row">
                                <Users size={16} />
                                <span className="dept-info-label">Team Size:</span>
                                <span className="dept-info-value">{dept.employee_count} members</span>
                            </div>
                            <div className="dept-info-row">
                                <MapPin size={16} />
                                <span className="dept-info-label">Location:</span>
                                <span className="dept-info-value">{dept.location}</span>
                            </div>
                            <div className="dept-info-row">
                                <DollarSign size={16} />
                                <span className="dept-info-label">Budget:</span>
                                <span className="dept-info-value" style={{ color: 'var(--success)' }}>₹{parseFloat(dept.budget || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDept ? 'Edit Department' : 'Add Department'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Department Name</label>
                        <input type="text" className="form-input" required placeholder="Enter department name"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input type="text" className="form-input" required placeholder="e.g., ENG"
                                value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <select className="form-input form-select" value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                {['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'].map(loc =>
                                    <option key={loc} value={loc}>{loc}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Head of Department</label>
                        <select className="form-input form-select" value={formData.head}
                            onChange={e => setFormData({ ...formData, head: e.target.value })}>
                            <option value="">Select Head</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Annual Budget (₹)</label>
                        <input type="number" className="form-input" placeholder="Enter budget"
                            value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>{editingDept ? 'Save Changes' : 'Add Department'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Department?"
                message={`Are you sure you want to delete "${editingDept?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
