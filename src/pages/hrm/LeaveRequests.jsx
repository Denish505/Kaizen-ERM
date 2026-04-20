import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Calendar, Plus, Check, X, Clock, Filter, Briefcase } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, Modal, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function LeaveRequests() {
    const { user } = useAuth()
    const [leaves, setLeaves] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        leave_type: '', start_date: '', end_date: '', reason: ''
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const [leavesRes, typesRes] = await Promise.all([
                hrmService.getLeaves(),
                hrmService.getLeaveTypes()
            ])
            setLeaves(leavesRes.data)
            setLeaveTypes(typesRes.data)
        } catch (err) {
            toast.error("Failed to fetch leave data")
        } finally {
            setLoading(false)
        }
    }

    const handleApplySubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const start = new Date(formData.start_date)
            const end = new Date(formData.end_date)
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1
            await hrmService.applyLeave({ ...formData, days: diffDays })
            toast.success('Leave request submitted!')
            setShowModal(false)
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' })
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to apply for leave')
        } finally {
            setSubmitting(false)
        }
    }

    const handleApprove = async (id) => {
        try {
            await hrmService.approveLeave(id)
            toast.success('Leave approved!')
            fetchData()
        } catch (err) {
            toast.error('Failed to approve leave')
        }
    }

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:')
        if (reason) {
            try {
                await hrmService.rejectLeave(id, reason)
                toast.success('Leave rejected')
                fetchData()
            } catch (err) {
                toast.error('Failed to reject leave')
            }
        }
    }

    const isManager = ['ceo', 'hr', 'project_manager', 'admin'].includes(user?.role)
    const displayData = leaves.filter(l => !statusFilter || l.status === statusFilter)

    const stats = {
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header"><div className="skeleton skeleton-title" style={{ width: '220px' }} /></div>
                <SkeletonCard count={3} />
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isManager ? 'Leave Requests' : 'My Leaves'}</h1>
                    <p className="page-subtitle">{isManager ? 'Manage team leave requests' : 'Apply and track your leaves'}</p>
                </div>
                <Button icon={Plus} onClick={() => setShowModal(true)}>Apply Leave</Button>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <Clock size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.pending}</div>
                    <div className="stat-card-label">Pending Approval</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Check size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.approved}</div>
                    <div className="stat-card-label">Approved</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                            <X size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.rejected}</div>
                    <div className="stat-card-label">Rejected</div>
                </div>
            </div>

            {/* Filter */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <select className="form-input form-select" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)' }}
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="glass-card">
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                {isManager && <th>Employee</th>}
                                <th>Leave Type</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                {isManager && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.length > 0 ? displayData.map((leave, idx) => (
                                <tr key={leave.id} className="stagger-item" style={{ '--index': idx }}>
                                    {isManager && (
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm">{leave.employee_name?.[0] || 'U'}</div>
                                                <div>
                                                    <span style={{ fontWeight: 500, display: 'block' }}>{leave.employee_name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.department_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td><span className="badge badge-info">{leave.leave_type_name || leave.leave_type}</span></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{leave.start_date}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{leave.end_date}</td>
                                    <td><strong>{leave.days}</strong></td>
                                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                        {leave.reason}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    {isManager && (
                                        <td>
                                            {leave.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-sm btn-success btn-icon" onClick={() => handleApprove(leave.id)}>
                                                        <Check size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleReject(leave.id)}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Briefcase size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No leave requests found</p>
                                        <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                                            Apply for Leave
                                        </Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Leave Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
                <form onSubmit={handleApplySubmit}>
                    <div className="form-group">
                        <label className="form-label">Leave Type</label>
                        <select className="form-input form-select" required value={formData.leave_type}
                            onChange={e => setFormData({ ...formData, leave_type: e.target.value })}>
                            <option value="">Select Leave Type</option>
                            {leaveTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">From Date</label>
                            <input type="date" className="form-input" required value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">To Date</label>
                            <input type="date" className="form-input" required value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reason</label>
                        <textarea className="form-input form-textarea" placeholder="Enter reason for leave..." rows={3} required
                            value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Submit Request</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
