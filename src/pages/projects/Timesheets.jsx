import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Filter, Loader, X, Trash2 } from 'lucide-react'
import { projectsService } from '../../services/projects.service'
import { format } from 'date-fns'
import { useAuth } from '../../App'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Timesheets() {
    const { user } = useAuth()
    const [timesheets, setTimesheets] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [projects, setProjects] = useState([])
    const [tasks, setTasks] = useState([])

    // Filter State
    const [filterDate, setFilterDate] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        project: '',
        task: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: '',
        description: ''
    })

    useEffect(() => {
        fetchData()
        fetchProjects()
    }, [filterDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = filterDate ? { date_from: filterDate, date_to: filterDate } : {}
            const res = await projectsService.getTimesheets(params)
            setTimesheets(res.data)
        } catch (err) {
            console.error("Failed to fetch timesheets", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchProjects = async () => {
        try {
            const res = await projectsService.getProjects()
            setProjects(res.data)
        } catch (err) {
            console.error("Failed to fetch projects")
        }
    }

    const handleProjectChange = async (projectId) => {
        setFormData({ ...formData, project: projectId, task: '' })
        if (!projectId) {
            setTasks([])
            return
        }
        try {
            const res = await projectsService.getTasks({ project: projectId })
            setTasks(res.data)
        } catch (err) {
            console.error("Failed to fetch tasks")
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await projectsService.createTimesheet(formData)
            toast.success('Time logged successfully')
            setShowModal(false)
            setFormData({
                project: '',
                task: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                hours: '',
                description: ''
            })
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to log time')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Area you sure you want to delete this entry?')) return
        try {
            await projectsService.deleteTimesheet(id)
            setTimesheets(timesheets.filter(t => t.id !== id))
            toast.success('Entry deleted')
        } catch (err) {
            toast.error('Failed to delete timesheet')
        }
    }

    if (loading && !timesheets.length) return <div className="loading-state"><Loader className="animate-spin" /> Loading Timesheets...</div>

    const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hours), 0)

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Timesheets</h1>
                    <p className="page-subtitle">Track your work hours</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setShowModal(true)
                    // Pre-fetch projects if needed or just rely on existing state
                }}>
                    <Plus size={18} /> Log Time
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-3 mb-6 gap-4">
                <div className="card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Total Hours (This View)</p>
                        <h3 className="text-2xl font-bold text-primary-600">{totalHours.toFixed(1)} hrs</h3>
                    </div>
                    <div className="bg-primary-100 p-3 rounded-full text-primary-600">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="card p-4 col-span-2 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Filter size={20} />
                        <span className="font-medium">Filter Date:</span>
                    </div>
                    <input
                        type="date"
                        className="form-input max-w-xs"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                        <button className="btn btn-sm btn-secondary" onClick={() => setFilterDate('')}>Clear</button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Project</th>
                                <th>Task</th>
                                <th>Description</th>
                                <th>Hours</th>
                                <th>User</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timesheets.map(entry => (
                                <tr key={entry.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {format(new Date(entry.date), 'MMM d, yyyy')}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-secondary">{entry.project_name || '-'}</span>
                                    </td>
                                    <td className="font-medium">{entry.task_title || '-'}</td>
                                    <td className="text-gray-600 max-w-xs truncate" title={entry.description}>
                                        {entry.description}
                                    </td>
                                    <td className="font-bold text-primary-700">{entry.hours} hrs</td>
                                    <td>
                                        <div className="text-sm">{entry.user_name}</div>
                                    </td>
                                    <td>
                                        {(user.id === entry.user || ['admin', 'manager'].includes(user.role)) && (
                                            <button className="btn-icon text-danger" onClick={() => handleDelete(entry.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {timesheets.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-400">
                                        No timesheet entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Time Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Time">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project</label>
                        <select
                            className="form-input form-select" required
                            value={formData.project}
                            onChange={e => handleProjectChange(e.target.value)}
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Task (Optional)</label>
                        <select
                            className="form-input form-select"
                            value={formData.task}
                            onChange={e => setFormData({ ...formData, task: e.target.value })}
                            disabled={!formData.project}
                        >
                            <option value="">General Project Work</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date" className="form-input" required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hours</label>
                            <input
                                type="number" step="0.5" className="form-input" required
                                value={formData.hours}
                                onChange={e => setFormData({ ...formData, hours: e.target.value })}
                                placeholder="e.g. 4.5"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input h-24" required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What did you work on?"
                        />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Save Entry</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
