import { useState, useEffect } from 'react'
import { FolderKanban, Plus, Search, TrendingUp, Users, DollarSign, Clock, Edit2, Trash2 } from 'lucide-react'
import { projectsService } from '../../services/projects.service'
import { hrmService } from '../../services/hrm.service'
import { clientsService } from '../../services/clients.service'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Button, Modal, ConfirmDialog, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Projects() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedProject, setSelectedProject] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [managers, setManagers] = useState([])
    const [clients, setClients] = useState([])

    const [formData, setFormData] = useState({
        name: '', client: '', description: '', status: 'planning',
        priority: 'medium', project_manager: '', start_date: '',
        end_date: '', budget: '', code: ''
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [projRes, mgrRes, clientRes] = await Promise.all([
                projectsService.getProjects(),
                hrmService.getEmployees(),
                clientsService.getClients()
            ])
            setProjects(projRes.data)
            setManagers(mgrRes.data)
            setClients(clientRes.data)
        } catch (err) {
            console.error("Error fetching data:", err)
            toast.error('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '', client: '', description: '', status: 'planning',
            priority: 'medium', project_manager: '', start_date: '',
            end_date: '', budget: '', code: ''
        })
    }

    const handleAdd = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleEdit = (project, e) => {
        e.stopPropagation()
        setSelectedProject(project)
        setFormData({
            name: project.name,
            client: project.client || '',
            description: project.description || '',
            status: project.status,
            priority: project.priority || 'medium',
            project_manager: project.project_manager || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            budget: project.budget || '',
            code: project.code || ''
        })
        setShowEditModal(true)
    }

    const handleDelete = (project, e) => {
        e.stopPropagation()
        setSelectedProject(project)
        setShowDeleteConfirm(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await projectsService.createProject({
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : 0
            })
            toast.success('Project created successfully!')
            setShowAddModal(false)
            resetForm()
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create project')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await projectsService.updateProject(selectedProject.id, {
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : 0
            })
            toast.success('Project updated successfully!')
            setShowEditModal(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update project')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSubmitting(true)
        try {
            await projectsService.deleteProject(selectedProject.id)
            toast.success('Project deleted successfully!')
            setShowDeleteConfirm(false)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete project')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = !statusFilter || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0),
    }

    const formatCurrency = (value) => {
        if (!value) return '₹0'
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
        return `₹${value.toLocaleString('en-IN')}`
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'badge-success'
            case 'in_progress': return 'badge-primary'
            case 'on_hold': return 'badge-warning'
            case 'cancelled': return 'badge-danger'
            default: return 'badge-info'
        }
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

    const ProjectForm = ({ onSubmit, submitText }) => (
        <form onSubmit={onSubmit}>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Project Name</label>
                    <input type="text" className="form-input" required value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Project Code</label>
                    <input type="text" className="form-input" required value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="PRJ-001" />
                </div>
                <div className="form-group">
                    <label className="form-label">Client</label>
                    <select className="form-input form-select" value={formData.client}
                        onChange={e => setFormData({ ...formData, client: e.target.value })}>
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Project Manager</label>
                    <select className="form-input form-select" value={formData.project_manager}
                        onChange={e => setFormData({ ...formData, project_manager: e.target.value })}>
                        <option value="">Select Manager</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Budget (₹)</label>
                    <input type="number" className="form-input" value={formData.budget}
                        onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input form-select" value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input form-select" value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input" value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input" value={formData.end_date}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{filteredProjects.length} active engagements</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" icon={Clock} onClick={() => navigate('/projects/timesheets')}>
                        Timesheets
                    </Button>
                    <Button icon={Plus} onClick={handleAdd}>New Project</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <FolderKanban size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.total}</div>
                    <div className="stat-card-label">Total Projects</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <TrendingUp size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.active}</div>
                    <div className="stat-card-label">Active Projects</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{projects.reduce((sum, p) => sum + (p.member_count || 0), 0)}</div>
                    <div className="stat-card-label">Team Members</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.totalBudget)}</div>
                    <div className="stat-card-label">Total Budget</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search projects or clients..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ width: 'auto', minWidth: '150px' }}
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-3" style={{ gap: '1.5rem' }}>
                {filteredProjects.map((project, idx) => (
                    <div key={project.id} className="glass-card stagger-item hover-lift"
                        style={{ padding: '1.5rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/projects/tasks?project=${project.id}`)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span className={`badge ${project.priority === 'urgent' ? 'badge-danger' :
                                    project.priority === 'high' ? 'badge-warning' :
                                        project.priority === 'medium' ? 'badge-primary' : 'badge-info'}`}
                                    style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{project.priority}</span>
                                <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{project.name}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{project.client_name || 'No Client'}</p>
                            </div>
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                                <span style={{ fontWeight: 500, color: 'var(--primary-400)' }}>{project.progress || 0}%</span>
                            </div>
                            <div className="progress">
                                <div className="progress-bar" style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <DollarSign size={14} /> {formatCurrency(project.budget)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} /> {project.end_date ? format(new Date(project.end_date), 'MMM d') : '-'}
                                </span>
                            </div>
                            <div className="action-buttons" style={{ opacity: 1 }}>
                                <button className="btn btn-sm btn-secondary" onClick={(e) => handleEdit(project, e)}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(project, e)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="empty-state">
                    <FolderKanban size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>No projects found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Create a new project to get started.</p>
                </div>
            )}

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Project" size="lg">
                <ProjectForm onSubmit={handleAddSubmit} submitText="Create Project" />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project" size="lg">
                <ProjectForm onSubmit={handleEditSubmit} submitText="Save Changes" />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Project?"
                message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={submitting}
            />
        </div>
    )
}
