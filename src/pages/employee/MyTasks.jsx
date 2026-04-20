import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { CheckSquare, Clock, AlertCircle, Plus, Filter, Search } from 'lucide-react'
import { projectsService } from '../../services/projects.service'
import { SkeletonCard, Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { getTodayIST } from '../../utils/dateUtils'

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

export default function MyTasks() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [updatingId, setUpdatingId] = useState(null)

    useEffect(() => { fetchTasks() }, [])

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const res = await projectsService.getMyTasks()
            setTasks(res.data)
        } catch (err) {
            console.error('Failed to fetch tasks', err)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (task, newStatus) => {
        setUpdatingId(task.id)
        try {
            await projectsService.updateTask(task.id, { status: newStatus })
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
            toast.success(`Task marked as ${newStatus.replace('_', ' ')}`)
        } catch (err) {
            toast.error('Failed to update task')
        } finally {
            setUpdatingId(null)
        }
    }

    const filtered = tasks.filter(t => {
        const matchSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchStatus = !statusFilter || t.status === statusFilter
        const matchPriority = !priorityFilter || t.priority === priorityFilter
        return matchSearch && matchStatus && matchPriority
    }).sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))

    const stats = {
        total: tasks.length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.due_date < getTodayIST() && t.status !== 'completed').length,
    }

    const isOverdue = (t) => t.due_date && t.due_date < getTodayIST() && t.status !== 'completed'

    if (loading) return <div className="animate-fadeIn"><SkeletonCard count={4} /></div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Tasks</h1>
                    <p className="page-subtitle">Track your assigned work items</p>
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Total', value: stats.total, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.15)', icon: <CheckSquare size={20} /> },
                    { label: 'In Progress', value: stats.inProgress, color: 'var(--info)', bg: 'var(--info-bg)', icon: <Clock size={20} /> },
                    { label: 'Completed', value: stats.completed, color: 'var(--success)', bg: 'var(--success-bg)', icon: <CheckSquare size={20} /> },
                    { label: 'Overdue', value: stats.overdue, color: 'var(--error)', bg: 'var(--error-bg)', icon: <AlertCircle size={20} /> },
                ].map(s => (
                    <div key={s.label} className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        </div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="header-search" style={{ flex: 1, minWidth: '220px' }}>
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select className="form-input form-select" style={{ width: 'auto' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                        <option value="">All Priorities</option>
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                </div>
            </div>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length > 0 ? filtered.map(t => (
                    <div key={t.id} className="glass-card stagger-item" style={{
                        padding: '1.25rem',
                        borderLeft: `4px solid ${t.priority === 'urgent' ? 'var(--error)' : t.priority === 'high' ? 'var(--warning)' : t.priority === 'medium' ? 'var(--info)' : 'var(--border-color)'}`,
                        opacity: updatingId === t.id ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                                        {t.title}
                                    </h4>
                                    {isOverdue(t) && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>OVERDUE</span>}
                                </div>
                                {t.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.6rem', lineClamp: 2 }}>{t.description}</p>}
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className={`badge ${t.priority === 'urgent' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : t.priority === 'medium' ? 'badge-info' : 'badge-secondary'}`}>
                                        {t.priority}
                                    </span>
                                    {t.project_name && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📁 {t.project_name}</span>}
                                    {t.due_date && (
                                        <span style={{ fontSize: '0.78rem', color: isOverdue(t) ? 'var(--error)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={12} /> Due: {t.due_date}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span className={`badge ${t.status === 'completed' ? 'badge-success' : t.status === 'in_progress' ? 'badge-info' : t.status === 'review' ? 'badge-warning' : 'badge-secondary'}`}>
                                    {t.status?.replace('_', ' ')}
                                </span>
                                {/* Quick status update */}
                                <select
                                    className="form-input form-select"
                                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', width: 'auto', minWidth: '120px' }}
                                    value={t.status}
                                    onChange={e => updateStatus(t, e.target.value)}
                                    disabled={updatingId === t.id}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">In Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No tasks found</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.3rem' }}>You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
