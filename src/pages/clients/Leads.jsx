import { useState, useEffect } from 'react'
import { Target, Plus, Search, TrendingUp, DollarSign, Users, Mail, ArrowRight, LayoutGrid, List, Edit2, Trash2 } from 'lucide-react'
import { clientsService } from '../../services/clients.service'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, ConfirmDialog } from '../../components/ui'
import { toast } from 'react-hot-toast'
import './Leads.css'

export default function Leads() {
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState('board')
    const [searchQuery, setSearchQuery] = useState('')
    const [stageFilter, setStageFilter] = useState('')

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const initialFormState = {
        name: '', company: '', email: '', phone: '',
        expected_value: '', source: 'website', city: 'Mumbai',
        probability: 10, stage: 'new'
    }
    const [formData, setFormData] = useState(initialFormState)

    useEffect(() => { fetchLeads() }, [])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const response = await clientsService.getLeads()
            setLeads(response.data)
        } catch (err) {
            console.error('Error fetching leads:', err)
            setError('Failed to load leads')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData(initialFormState)
        setSelectedLead(null)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                ...formData,
                expected_value: formData.expected_value ? parseFloat(formData.expected_value) : 0,
                probability: parseInt(formData.probability)
            }
            if (selectedLead) {
                await clientsService.updateLead(selectedLead.id, payload)
                toast.success('Lead updated successfully')
                setShowEditModal(false)
            } else {
                await clientsService.createLead(payload)
                toast.success('Lead created successfully')
                setShowAddModal(false)
            }
            resetForm()
            fetchLeads()
        } catch (err) {
            toast.error(err.response?.data?.detail || `Failed to ${selectedLead ? 'update' : 'create'} lead`)
        }
    }

    const handleEditClick = (lead) => {
        setSelectedLead(lead)
        setFormData({
            name: lead.name, company: lead.company, email: lead.email,
            phone: lead.phone, expected_value: lead.expected_value,
            source: lead.source, city: lead.city || 'Mumbai',
            probability: lead.probability, stage: lead.stage
        })
        setShowEditModal(true)
    }

    const handleDeleteClick = (id) => { setDeleteId(id) }

    const confirmDelete = async () => {
        try {
            await clientsService.deleteLead(deleteId)
            toast.success('Lead deleted successfully')
            setLeads(leads.filter(l => l.id !== deleteId))
        } catch (err) {
            toast.error('Failed to delete lead')
        } finally {
            setDeleteId(null)
        }
    }

    const updateLeadStage = async (id, newStage) => {
        try {
            setLeads(leads.map(l => l.id === id ? { ...l, stage: newStage } : l))
            await clientsService.updateLead(id, { stage: newStage })
            if (newStage === 'won') {
                if (window.confirm('Lead marked as Won! Convert this lead to a Client now?')) {
                    handleConvertLead(id)
                }
            } else {
                toast.success(`Stage updated to ${stages.find(s => s.id === newStage)?.name}`)
            }
        } catch (err) {
            fetchLeads()
            toast.error('Failed to update status')
        }
    }

    const handleConvertLead = async (id) => {
        try {
            await clientsService.convertLead(id)
            toast.success('Lead converted! Redirecting to Clients...')
            navigate('/clients')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to convert lead')
        }
    }

    const stages = [
        { id: 'new', name: 'New Lead', accent: 'var(--text-muted)' },
        { id: 'contacted', name: 'Contacted', accent: 'var(--info)' },
        { id: 'qualified', name: 'Qualified', accent: 'var(--primary-400)' },
        { id: 'proposal', name: 'Proposal', accent: 'var(--warning)' },
        { id: 'negotiation', name: 'Negotiation', accent: 'var(--accent-500)' },
        { id: 'won', name: 'Won', accent: 'var(--success)' },
        { id: 'lost', name: 'Lost', accent: 'var(--error)' },
    ]

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.company.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStage = !stageFilter || l.stage === stageFilter
        return matchesSearch && matchesStage
    })

    const totalValue = leads.reduce((sum, l) => sum + parseFloat(l.expected_value || 0), 0)
    const weightedValue = leads.reduce((sum, l) => sum + (parseFloat(l.expected_value || 0) * (l.probability || 0) / 100), 0)

    const formatCurrency = (value) => {
        if (!value) return '₹0'
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
        return `₹${value.toLocaleString('en-IN')}`
    }

    const getProbabilityBadge = (p) => {
        if (p >= 70) return 'badge-success'
        if (p >= 40) return 'badge-warning'
        return 'badge-danger'
    }

    const getStageBadge = (stageId) => {
        switch (stageId) {
            case 'won': return 'badge-success'
            case 'lost': return 'badge-danger'
            case 'qualified': return 'badge-primary'
            case 'proposal': return 'badge-warning'
            case 'negotiation': return 'badge-info'
            default: return 'badge-secondary'
        }
    }

    if (loading) return (
        <div className="animate-fadeIn" style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--primary-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )

    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leads Pipeline</h1>
                    <p className="page-subtitle">{leads.length} opportunities in progress</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* View Toggle */}
                    <div style={{
                        display: 'flex', background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px'
                    }}>
                        <button
                            className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.4rem 0.7rem' }}
                            onClick={() => setViewMode('board')} title="Kanban View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.4rem 0.7rem' }}
                            onClick={() => setViewMode('list')} title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <Button icon={Plus} onClick={() => { resetForm(); setShowAddModal(true) }}>
                        Add Lead
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)' }}>
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="stat-card-value">{leads.length}</div>
                    <div className="stat-card-label">Total Leads</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="stat-card-value">{leads.filter(l => ['negotiation', 'proposal'].includes(l.stage)).length}</div>
                    <div className="stat-card-label">Hot Leads</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(totalValue)}</div>
                    <div className="stat-card-label">Pipeline Value</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(weightedValue)}</div>
                    <div className="stat-card-label">Weighted Value</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search leads by name or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: 'auto', minWidth: '150px' }}
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                    >
                        <option value="">All Stages</option>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* ========== KANBAN VIEW ========== */}
            {viewMode === 'board' && (
                <div className="kanban-board">
                    {stages.filter(s => !['won', 'lost'].includes(s.id)).map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.stage === stage.id)
                        return (
                            <div key={stage.id} className="kanban-column">
                                <div className="kanban-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.accent, display: 'inline-block' }} />
                                        <span>{stage.name}</span>
                                    </div>
                                    <span style={{
                                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)'
                                    }}>
                                        {stageLeads.length}
                                    </span>
                                </div>
                                <div className="kanban-body">
                                    {stageLeads.map((lead) => (
                                        <div key={lead.id} className="kanban-card" style={{ '--card-border-color': stage.accent }}>
                                            {/* Card Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h4 className="card-title" style={{ flex: 1, marginRight: '0.5rem' }}>{lead.name}</h4>
                                                <div className="action-buttons" style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                >
                                                    <button
                                                        onClick={() => handleEditClick(lead)}
                                                        className="btn btn-sm btn-secondary btn-icon"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(lead.id)}
                                                        className="btn btn-sm btn-danger btn-icon"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="card-subtitle">{lead.company}</p>

                                            {/* Value + Probability */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: 'var(--bg-card)', padding: '0.5rem 0.75rem',
                                                borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem'
                                            }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                    {formatCurrency(lead.expected_value)}
                                                </span>
                                                <span className={`badge ${getProbabilityBadge(lead.probability)}`}>
                                                    {lead.probability}%
                                                </span>
                                            </div>

                                            {/* Footer */}
                                            <div className="card-footer">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    <Mail size={12} />
                                                    <span>{lead.source}</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-400)', cursor: 'pointer' }}>
                                                        Move <ArrowRight size={11} style={{ display: 'inline' }} />
                                                    </span>
                                                    <select
                                                        value={lead.stage}
                                                        onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                                                        style={{
                                                            position: 'absolute', inset: 0, opacity: 0,
                                                            cursor: 'pointer', width: '100%'
                                                        }}
                                                    >
                                                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {stageLeads.length === 0 && (
                                        <div style={{
                                            textAlign: 'center', padding: '2rem 1rem',
                                            color: 'var(--text-muted)', fontSize: '0.85rem',
                                            border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                                            fontStyle: 'italic'
                                        }}>
                                            No leads here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ========== LIST VIEW ========== */}
            {viewMode === 'list' && (
                <div className="glass-card">
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Contact</th>
                                    <th>Company</th>
                                    <th>Value</th>
                                    <th>Stage</th>
                                    <th>Probability</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="stagger-item">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)', fontWeight: 700 }}>
                                                    {lead.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{lead.company}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(lead.expected_value)}</td>
                                        <td>
                                            <span className={`badge ${getStageBadge(lead.stage)}`}>
                                                {stages.find(s => s.id === lead.stage)?.name || lead.stage}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '60px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            height: '100%', borderRadius: '3px', width: `${lead.probability}%`,
                                                            background: lead.probability >= 70 ? 'var(--success)' : lead.probability >= 40 ? 'var(--warning)' : 'var(--error)'
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.probability}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ opacity: 1, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-sm btn-secondary btn-icon" onClick={() => handleEditClick(lead)} title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteClick(lead.id)} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            <Target size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                                            <p>No leads found matching your filters</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={showAddModal || showEditModal}
                onClose={() => { setShowAddModal(false); setShowEditModal(false); resetForm() }}
                title={selectedLead ? 'Edit Lead' : 'Add New Lead'}
                size="md"
            >
                <form onSubmit={handleAddSubmit}>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input type="text" className="form-input" required placeholder="Full name"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company</label>
                            <input type="text" className="form-input" placeholder="Company name"
                                value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="Email address"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input type="tel" className="form-input" placeholder="Phone"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Expected Value (₹)</label>
                            <input type="number" className="form-input" placeholder="Amount"
                                value={formData.expected_value} onChange={e => setFormData({ ...formData, expected_value: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Probability (%)</label>
                            <input type="number" className="form-input" placeholder="10-100" min="0" max="100"
                                value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Source</label>
                            <select className="form-input form-select" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                                <option value="website">Website</option>
                                <option value="referral">Referral</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="cold_call">Cold Call</option>
                                <option value="event">Event</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select className="form-input form-select" value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })}>
                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>Cancel</Button>
                        <Button type="submit">{selectedLead ? 'Save Changes' : 'Add Lead'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Lead"
                message="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    )
}
