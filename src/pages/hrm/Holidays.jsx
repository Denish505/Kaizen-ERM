import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, PartyPopper } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { format } from 'date-fns'
import { useAuth } from '../../App'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Holidays() {
    const { user } = useAuth()
    const [holidays, setHolidays] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedHoliday, setSelectedHoliday] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '', date: '', description: '', is_recurring: true
    })

    useEffect(() => { fetchHolidays() }, [])

    const fetchHolidays = async () => {
        try {
            const res = await hrmService.getHolidays()
            setHolidays(res.data)
        } catch (err) {
            toast.error("Failed to fetch holidays")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await hrmService.createHoliday(formData)
            toast.success('Holiday added successfully!')
            setShowModal(false)
            setFormData({ name: '', date: '', description: '', is_recurring: true })
            fetchHolidays()
        } catch (err) {
            toast.error('Failed to create holiday')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (holiday) => {
        setSelectedHoliday(holiday)
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            await hrmService.deleteHoliday(selectedHoliday.id)
            toast.success('Holiday deleted')
            setShowDeleteConfirm(false)
            setHolidays(holidays.filter(h => h.id !== selectedHoliday.id))
        } catch (err) {
            toast.error('Failed to delete holiday')
        }
    }

    const canEdit = ['admin', 'hr', 'ceo'].includes(user?.role)

    // Group holidays by upcoming and past
    const today = new Date()
    const upcomingHolidays = holidays.filter(h => new Date(h.date) >= today)
    const pastHolidays = holidays.filter(h => new Date(h.date) < today)

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header"><div className="skeleton skeleton-title" style={{ width: '200px' }} /></div>
                <SkeletonCard count={6} />
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Holidays</h1>
                    <p className="page-subtitle">{holidays.length} holidays listed for this year</p>
                </div>
                {canEdit && (
                    <Button icon={Plus} onClick={() => setShowModal(true)}>Add Holiday</Button>
                )}
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Calendar size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{holidays.length}</div>
                    <div className="stat-card-label">Total Holidays</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <PartyPopper size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{upcomingHolidays.length}</div>
                    <div className="stat-card-label">Upcoming</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <Calendar size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{holidays.filter(h => h.is_recurring).length}</div>
                    <div className="stat-card-label">Recurring</div>
                </div>
            </div>

            {/* Holiday Cards */}
            <div className="grid grid-3" style={{ gap: '1.25rem' }}>
                {holidays.map((holiday, idx) => (
                    <div key={holiday.id} className="glass-card hover-lift stagger-item" style={{ '--index': idx, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', width: 44, height: 44, borderRadius: 12 }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{holiday.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                            {canEdit && (
                                <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteClick(holiday)}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        {holiday.description && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                {holiday.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {holiday.is_recurring && <span className="badge badge-info">Recurring</span>}
                            {new Date(holiday.date) >= today && <span className="badge badge-success">Upcoming</span>}
                        </div>
                    </div>
                ))}
            </div>

            {holidays.length === 0 && (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Calendar size={64} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No holidays found</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Get started by adding company holidays</p>
                    {canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Add First Holiday</Button>}
                </div>
            )}

            {/* Add Holiday Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Holiday">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Holiday Name</label>
                        <input type="text" className="form-input" required placeholder="e.g. Independence Day"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-input" required
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (Optional)</label>
                        <textarea className="form-input form-textarea" rows={2}
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_recurring}
                                onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })} />
                            <span>Recurring every year</span>
                        </label>
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Add Holiday</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm} title="Delete Holiday"
                message={`Are you sure you want to delete "${selectedHoliday?.name}"?`} confirmText="Delete" variant="danger" />
        </div>
    )
}
