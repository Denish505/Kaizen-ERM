import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Users, Plus, Search, Mail, Phone, Building2, MapPin, Grid, List, Edit2, Trash2, Loader2 } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Employees() {
    const { user } = useAuth()
    const [employees, setEmployees] = useState([])
    const [departments, setDepartments] = useState([])
    const [designations, setDesignations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDept, setSelectedDept] = useState('')
    const [viewMode, setViewMode] = useState('grid')

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        city: 'Mumbai',
        password: 'employee123'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [empRes, deptRes, desigRes] = await Promise.all([
                hrmService.getEmployees(),
                hrmService.getDepartments(),
                hrmService.getDesignations()
            ])
            setEmployees(empRes.data)
            setDepartments(deptRes.data)
            setDesignations(desigRes.data)
        } catch (err) {
            console.error("Failed to fetch data", err)
            toast.error("Failed to load employees")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            first_name: '', last_name: '', email: '', phone: '',
            department: '', designation: '', city: 'Mumbai', password: 'password123'
        })
    }

    const handleAdd = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleEdit = (emp) => {
        setSelectedEmployee(emp)
        setFormData({
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            phone: emp.phone || '',
            department: emp.department || '',
            designation: emp.designation || '',
            city: emp.city || 'Mumbai',
            password: ''
        })
        setShowEditModal(true)
    }

    const handleDelete = (emp) => {
        setSelectedEmployee(emp)
        setShowDeleteConfirm(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await hrmService.createEmployee(formData)
            toast.success('Employee added successfully!')
            setShowAddModal(false)
            resetForm()
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create employee')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await hrmService.updateEmployee(selectedEmployee.id, formData)
            toast.success('Employee updated successfully!')
            setShowEditModal(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update employee')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSubmitting(true)
        try {
            await hrmService.deleteEmployee(selectedEmployee.id)
            toast.success('Employee deleted successfully!')
            setShowDeleteConfirm(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete employee')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredEmployees = employees.filter(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDept = !selectedDept || (emp.department && emp.department.toString() === selectedDept)
        return matchesSearch && matchesDept
    })

    const canEdit = ['ceo', 'hr'].includes(user?.role)

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

    const EmployeeForm = ({ onSubmit, submitText }) => (
        <form onSubmit={onSubmit}>
            <div className="grid grid-2">
                <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                        type="text" className="form-input" required
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                        type="text" className="form-input" required
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    type="email" className="form-input" required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                    type="tel" className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>
            <div className="grid grid-2">
                <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                        className="form-input form-select" required
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Designation</label>
                    <select
                        className="form-input form-select" required
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    >
                        <option value="">Select Designation</option>
                        {designations.map(desig => (
                            <option key={desig.id} value={desig.id}>{desig.title}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">City</label>
                <select
                    className="form-input form-select"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                >
                    {['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur'].map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                <Button variant="secondary" type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>
                    {submitText}
                </Button>
            </div>
        </form>
    )

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">{employees.length} team members across India</p>
                </div>
                {canEdit && (
                    <Button icon={Plus} onClick={handleAdd}>
                        Add Employee
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{employees.length}</div>
                    <div className="stat-card-label">Total Employees</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Building2 size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{departments.length}</div>
                    <div className="stat-card-label">Departments</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <MapPin size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{[...new Set(employees.map(e => e.city))].length}</div>
                    <div className="stat-card-label">Office Locations</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{employees.filter(e => e.is_active).length}</div>
                    <div className="stat-card-label">Active Employees</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: 'auto', minWidth: '180px' }}
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Employee Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-4">
                    {filteredEmployees.map((emp, idx) => (
                        <div key={emp.id} className="glass-card stagger-item" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <div className="avatar avatar-lg" style={{ margin: '0 auto 1rem', width: '64px', height: '64px', fontSize: '1.25rem' }}>
                                {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                            <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{emp.first_name} {emp.last_name}</h4>
                            <p style={{ color: 'var(--primary-400)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{emp.designation || 'Employee'}</p>
                            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
                                {departments.find(d => d.id === emp.department)?.name || 'General'}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <MapPin size={14} /> {emp.city || 'India'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <Mail size={14} /> {emp.email}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-warning'}`}>
                                    {emp.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {canEdit && (
                                <div className="action-buttons" style={{ justifyContent: 'center', marginTop: '1rem', opacity: 1 }}>
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(emp)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card">
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Location</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    {canEdit && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp, idx) => (
                                    <tr key={emp.id} className="stagger-item">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm">{emp.first_name[0]}</div>
                                                <div>
                                                    <p style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-primary">{departments.find(d => d.id === emp.department)?.name || '-'}</span></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{emp.designation}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{emp.city}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{emp.phone}</td>
                                        <td>
                                            <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-warning'}`}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {canEdit && (
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
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="md">
                <EmployeeForm onSubmit={handleAddSubmit} submitText="Add Employee" />
            </Modal>

            {/* Edit Employee Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Employee" size="md">
                <EmployeeForm onSubmit={handleEditSubmit} submitText="Save Changes" />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Employee?"
                message={`Are you sure you want to delete ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
