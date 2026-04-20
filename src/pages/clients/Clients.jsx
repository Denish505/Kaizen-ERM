import { useState, useEffect } from 'react'
import { UserCircle, Plus, Search, Mail, Phone, MapPin, Building2, DollarSign, Edit2, Trash2, FileText, Briefcase } from 'lucide-react'
import { clientsService } from '../../services/clients.service'
import { Button, Modal, ConfirmDialog, SkeletonCard, Drawer } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Clients() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [industryFilter, setIndustryFilter] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showDetailDrawer, setShowDetailDrawer] = useState(false)
    const [selectedClient, setSelectedClient] = useState(null)
    const [clientDetails, setClientDetails] = useState({ contacts: [], deals: [], contracts: [] })
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: '', company_name: '', email: '', phone: '',
        city: '', state: 'Maharashtra', industry: '', gstin: '',
        status: 'active', revenue: ''
    })

    useEffect(() => { fetchClients() }, [])

    const fetchClients = async () => {
        setLoading(true)
        try {
            const response = await clientsService.getClients()
            setClients(response.data)
        } catch (err) {
            console.error("Error:", err)
            toast.error("Failed to load clients")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '', company_name: '', email: '', phone: '', city: '',
            state: 'Maharashtra', industry: '', gstin: '', status: 'active', revenue: ''
        })
    }

    const handleAdd = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleEdit = (client, e) => {
        e?.stopPropagation()
        setSelectedClient(client)
        setFormData({
            name: client.name,
            company_name: client.company_name,
            email: client.email,
            phone: client.phone || '',
            city: client.city || '',
            state: client.state || 'Maharashtra',
            industry: client.industry || '',
            gstin: client.gstin || '',
            status: client.status || 'active',
            revenue: client.total_revenue || ''
        })
        setShowEditModal(true)
    }

    const handleDelete = (client, e) => {
        e?.stopPropagation()
        setSelectedClient(client)
        setShowDeleteConfirm(true)
    }

    const openClientDetail = async (client) => {
        setSelectedClient(client)
        setShowDetailDrawer(true)
        try {
            const [contactsRes, dealsRes, contractsRes] = await Promise.all([
                clientsService.getClientContacts(client.id),
                clientsService.getClientDeals(client.id),
                clientsService.getClientContracts(client.id)
            ])
            setClientDetails({
                contacts: contactsRes.data,
                deals: dealsRes.data,
                contracts: contractsRes.data
            })
        } catch (err) {
            console.error("Failed to load details")
        }
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await clientsService.createClient({
                ...formData,
                total_revenue: formData.revenue ? parseFloat(formData.revenue) : 0
            })
            toast.success('Client created successfully!')
            setShowAddModal(false)
            resetForm()
            fetchClients()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create client')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await clientsService.updateClient(selectedClient.id, {
                ...formData,
                total_revenue: formData.revenue ? parseFloat(formData.revenue) : 0
            })
            toast.success('Client updated successfully!')
            setShowEditModal(false)
            fetchClients()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update client')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSubmitting(true)
        try {
            await clientsService.deleteClient(selectedClient.id)
            toast.success('Client deleted successfully!')
            setShowDeleteConfirm(false)
            fetchClients()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete client')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.company_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesIndustry = !industryFilter || c.industry === industryFilter
        return matchesSearch && matchesIndustry
    })

    const industries = [...new Set(clients.map(c => c.industry).filter(Boolean))]
    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        revenue: clients.reduce((sum, c) => sum + parseFloat(c.total_revenue || 0), 0),
        industries: industries.length
    }

    const formatCurrency = (value) => {
        if (!value) return '-'
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
        return `₹${value.toLocaleString('en-IN')}`
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

    const ClientForm = ({ onSubmit, submitText }) => (
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input type="text" className="form-input" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" required value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" required value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="tel" className="form-input" required value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" className="form-input" value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" className="form-input" value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })} />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-input form-select" value={formData.industry}
                    onChange={e => setFormData({ ...formData, industry: e.target.value })}>
                    <option value="">Select Industry</option>
                    {['IT Services', 'Banking', 'Retail', 'Healthcare', 'Manufacturing', 'Other'].map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Revenue (₹)</label>
                    <input type="number" className="form-input" value={formData.revenue}
                        onChange={e => setFormData({ ...formData, revenue: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">GSTIN</label>
                    <input type="text" className="form-input" value={formData.gstin}
                        onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
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
                    <h1 className="page-title">Clients</h1>
                    <p className="page-subtitle">{filteredClients.length} clients across India</p>
                </div>
                <Button icon={Plus} onClick={handleAdd}>Add Client</Button>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <UserCircle size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.total}</div>
                    <div className="stat-card-label">Total Clients</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Building2 size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.active}</div>
                    <div className="stat-card-label">Active</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.revenue)}</div>
                    <div className="stat-card-label">Total Revenue</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <MapPin size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.industries}</div>
                    <div className="stat-card-label">Industries</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search clients..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ width: 'auto', minWidth: '150px' }}
                        value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
                        <option value="">All Industries</option>
                        {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card">
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>GSTIN</th>
                                <th>Revenue</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client, idx) => (
                                <tr key={client.id} className="stagger-item" style={{ cursor: 'pointer' }}
                                    onClick={() => openClientDetail(client)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="avatar avatar-sm">
                                                {client.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{client.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{client.company_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.industry}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>{client.email}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.phone}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{client.city}, {client.state}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{client.gstin}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(client.total_revenue)}</td>
                                    <td>
                                        <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{ opacity: 1 }}>
                                            <button className="btn btn-sm btn-secondary" onClick={(e) => handleEdit(client, e)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(client, e)}>
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

            {/* Detail Drawer */}
            <Drawer isOpen={showDetailDrawer} onClose={() => setShowDetailDrawer(false)}
                title={selectedClient?.company_name || 'Client Details'}>
                {selectedClient && (
                    <div>
                        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                                <span>{selectedClient.city}, {selectedClient.state}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                                <span>{selectedClient.email}</span>
                            </div>
                        </div>

                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserCircle size={18} /> Contacts
                        </h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            {clientDetails.contacts.map(c => (
                                <div key={c.id} className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.designation}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>{c.email}</div>
                                </div>
                            ))}
                            {clientDetails.contacts.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No contacts</p>
                            )}
                        </div>

                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Briefcase size={18} /> Active Deals
                        </h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            {clientDetails.deals.map(d => (
                                <div key={d.id} className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 500 }}>{d.title}</span>
                                        <span className="badge badge-info">{d.stage}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(d.value)}</div>
                                </div>
                            ))}
                            {clientDetails.deals.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No active deals</p>
                            )}
                        </div>

                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} /> Contracts
                        </h4>
                        <div>
                            {clientDetails.contracts.map(c => (
                                <div key={c.id} className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 500 }}>{c.title}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCurrency(c.value)}</span>
                                    </div>
                                </div>
                            ))}
                            {clientDetails.contracts.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No contracts</p>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Client" size="md">
                <ClientForm onSubmit={handleAddSubmit} submitText="Add Client" />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Client" size="md">
                <ClientForm onSubmit={handleEditSubmit} submitText="Save Changes" />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Client?"
                message={`Are you sure you want to delete "${selectedClient?.company_name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
