import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { CheckSquare, Plus, Search, Clock, AlertCircle, Filter, List, Columns, MessageSquare, Paperclip, X, Calendar, ArrowLeft } from 'lucide-react'
import { projectsService } from '../../services/projects.service'
import { hrmService } from '../../services/hrm.service'
import { format } from 'date-fns'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { useSearchParams, Link } from 'react-router-dom'

export default function Tasks() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const projectFilter = searchParams.get('project')
    const [viewMode, setViewMode] = useState('list')
    const [statusFilter, setStatusFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState([])
    const [employees, setEmployees] = useState([])

    // Details State
    const [comments, setComments] = useState([])
    const [attachments, setAttachments] = useState([])
    const [newComment, setNewComment] = useState('')

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        project: '',
        priority: 'medium',
        due_date: '',
        description: '',
        assignee: '',
        estimated_hours: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tasksRes, projectsRes, employeesRes] = await Promise.all([
                projectsService.getTasks(),
                projectsService.getProjects(),
                hrmService.getEmployees()
            ])
            setTasks(tasksRes.data)
            setProjects(projectsRes.data)
            setEmployees(employeesRes.data)
        } catch (err) {
            console.error("Error fetching task data:", err)
        } finally {
            setLoading(false)
        }
    }

    const openTaskDetail = async (task) => {
        setSelectedTask(task)
        setShowDetailModal(true)
        try {
            const [commentsRes, attachmentsRes] = await Promise.all([
                projectsService.getTaskComments(task.id),
                projectsService.getTaskAttachments(task.id)
            ])
            setComments(commentsRes.data)
            setAttachments(attachmentsRes.data)
        } catch (err) {
            console.error("Failed to fetch task details")
        }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                ...formData,
                estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : 0
            }
            await projectsService.createTask(payload)
            toast.success('Task created successfully')
            setShowAddModal(false)
            setFormData({
                title: '', project: '', priority: 'medium', due_date: '',
                description: '', assignee: '', estimated_hours: ''
            })
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create task')
        }
    }

    const updateTaskStatus = async (id, newStatus) => {
        try {
            setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t))
            await projectsService.updateTaskStatus(id, newStatus)
            if (selectedTask && selectedTask.id === id) {
                setSelectedTask({ ...selectedTask, status: newStatus })
            }
            toast.success('Task status updated')
        } catch (err) {
            toast.error("Failed to update status")
            fetchData()
        }
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return
        try {
            await projectsService.addTaskComment(selectedTask.id, { content: newComment })
            setNewComment('')
            // Refresh comments
            const res = await projectsService.getTaskComments(selectedTask.id)
            setComments(res.data)
            toast.success('Comment added')
        } catch (err) {
            toast.error("Failed to add comment")
        }
    }

    const isManager = ['ceo', 'project_manager', 'admin'].includes(user?.role)

    const filteredTasks = tasks.filter(t => {
        const taskAssigneeEmail = t.assignee_details?.email
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = !statusFilter || t.status === statusFilter
        const matchesUser = isManager || taskAssigneeEmail === user?.email
        const matchesProject = !projectFilter || String(t.project) === projectFilter
        return matchesSearch && matchesStatus && matchesUser && matchesProject
    })

    const stats = {
        todo: filteredTasks.filter(t => t.status === 'todo').length,
        inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
        review: filteredTasks.filter(t => t.status === 'review').length,
        completed: filteredTasks.filter(t => t.status === 'completed').length,
    }

    const kanbanColumns = [
        { id: 'todo', title: 'To Do', color: 'text-gray-500' },
        { id: 'in_progress', title: 'In Progress', color: 'text-primary-600' },
        { id: 'review', title: 'In Review', color: 'text-warning-600' },
        { id: 'completed', title: 'Completed', color: 'text-success-600' },
    ]

    const getPriorityColor = (p) => {
        switch (p) {
            case 'urgent': return 'badge-danger';
            case 'high': return 'badge-warning';
            case 'medium': return 'badge-primary';
            default: return 'badge-info';
        }
    }

    if (loading) return <div className="loading-state">Loading tasks...</div>

    return (
        <div className="animate-fadeIn">
            {projectFilter && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/projects" className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ArrowLeft size={14} /> Back to Projects
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Showing tasks for: <strong>{projects.find(p => String(p.id) === projectFilter)?.name || 'Selected Project'}</strong>
                    </span>
                </div>
            )}
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isManager ? 'All Tasks' : 'My Tasks'}</h1>
                    <p className="page-subtitle">{filteredTasks.length} tasks assigned</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> New Task
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-4 mb-8">
                <div className="stat-card">
                    <div className="stat-card-icon bg-gray-100 text-gray-500"><CheckSquare size={24} /></div>
                    <div className="stat-card-value">{stats.todo}</div>
                    <div className="stat-card-label">To Do</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon primary"><Clock size={24} /></div>
                    <div className="stat-card-value">{stats.inProgress}</div>
                    <div className="stat-card-label">In Progress</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon warning"><AlertCircle size={24} /></div>
                    <div className="stat-card-value">{stats.review}</div>
                    <div className="stat-card-label">In Review</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon success"><CheckSquare size={24} /></div>
                    <div className="stat-card-value">{stats.completed}</div>
                    <div className="stat-card-label">Completed</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4">
                <div className="flex gap-4 flex-wrap items-center">
                    <div className="header-search flex-1 min-w-[250px]">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={16} />
                        </button>
                        <button
                            className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            <Columns size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'kanban' ? (
                <div className="grid grid-cols-4 gap-4 overflow-x-auto pb-4">
                    {kanbanColumns.map(column => (
                        <div key={column.id} className="bg-gray-50 rounded-xl p-4 min-w-[280px]">
                            <h3 className={`font-semibold mb-4 flex justify-between items-center ${column.color}`}>
                                {column.title}
                                <span className="text-xs bg-white px-2 py-1 rounded shadow-sm text-gray-600">
                                    {filteredTasks.filter(t => t.status === column.id).length}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {filteredTasks.filter(t => t.status === column.id).map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                                        onClick={() => openTaskDetail(task)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`badge ${getPriorityColor(task.priority)} text-[10px] px-1.5 py-0.5`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm mb-2 line-clamp-2">{task.title}</p>
                                        <p className="text-xs text-gray-500 mb-3 truncate">{task.project_name}</p>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <div className="avatar w-6 h-6 text-[10px] bg-primary-50 text-primary-600">
                                                {task.assignee_details?.first_name?.[0] || 'U'}
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {task.due_date ? format(new Date(task.due_date), 'MMM d') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Project</th>
                                    <th>Assignee</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openTaskDetail(task)}>
                                        <td className="font-medium">{task.title}</td>
                                        <td className="text-gray-500">{task.project_name}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="avatar w-6 h-6 text-[10px]">
                                                    {task.assignee_details?.first_name?.[0] || 'U'}
                                                </div>
                                                <span className="text-sm">{task.assignee_details?.first_name}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span></td>
                                        <td className="text-gray-500 text-sm">{task.due_date}</td>
                                        <td>
                                            <select
                                                className="form-input text-xs py-1 px-2 w-auto border-gray-200"
                                                value={task.status}
                                                onClick={e => e.stopPropagation()}
                                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">In Review</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <div className="modal-overlay active" onClick={() => setShowDetailModal(false)}>
                    <div className="modal w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="modal-header border-b border-gray-100 py-4 px-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{selectedTask.title}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    In {selectedTask.project_name}
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span>#{selectedTask.id}</span>
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
                        </div>

                        <div className="modal-body p-0 flex flex-1 overflow-hidden">
                            {/* Left Column: Details */}
                            <div className="w-2/3 p-6 overflow-y-auto border-r border-gray-100">
                                <div className="prose prose-sm max-w-none text-gray-600 mb-8">
                                    <h4 className="text-gray-900 font-semibold mb-2">Description</h4>
                                    <p className="whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>
                                </div>

                                {/* Comments Section */}
                                <div className="mt-8">
                                    <h4 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} /> Comments ({comments.length})
                                    </h4>

                                    <div className="space-y-4 mb-6">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="avatar w-8 h-8 flex-shrink-0 bg-primary-50 text-primary-600 text-xs shadow-sm">
                                                    {comment.user_name?.[0]}
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3 flex-1">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="font-semibold text-sm text-gray-800">{comment.user_name}</span>
                                                        <span className="text-xs text-gray-400">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            className="form-input flex-1"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                        />
                                        <button className="btn btn-primary" disabled={!newComment.trim()}>Send</button>
                                    </form>
                                </div>
                            </div>

                            {/* Right Column: Meta */}
                            <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
                                <form className="space-y-6">
                                    <div className="form-group">
                                        <label className="text-xs font-semibold uppercase text-gray-500">Status</label>
                                        <select
                                            className="form-input bg-white"
                                            value={selectedTask.status}
                                            onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value)}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="review">In Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="text-xs font-semibold uppercase text-gray-500">Assignee</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="avatar w-6 h-6 text-xs">{selectedTask.assignee_details?.first_name?.[0]}</div>
                                            <span className="text-sm font-medium">{selectedTask.assignee_details?.first_name} {selectedTask.assignee_details?.last_name}</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="text-xs font-semibold uppercase text-gray-500">Details</label>
                                        <div className="space-y-3 mt-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Priority</span>
                                                <span className={`badge ${getPriorityColor(selectedTask.priority)}`}>{selectedTask.priority}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Due Date</span>
                                                <span>{selectedTask.due_date ? format(new Date(selectedTask.due_date), 'MMM d, yyyy') : '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Est. Hours</span>
                                                <span>{selectedTask.estimated_hours} hrs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group pt-4 border-t border-gray-200">
                                        <label className="text-xs font-semibold uppercase text-gray-500 mb-2 block">Attachments</label>
                                        <div className="space-y-2">
                                            {attachments.map(att => (
                                                <div key={att.id} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
                                                    <Paperclip size={14} />
                                                    <span className="truncate">{att.file?.split('/').pop()}</span>
                                                </div>
                                            ))}
                                            {attachments.length === 0 && <p className="text-sm text-gray-400 italic">No attachments</p>}
                                        </div>
                                        {/* Upload placeholder */}
                                        <button type="button" className="btn btn-sm btn-secondary w-full mt-3" onClick={() => alert('File upload coming soon')}>
                                            <Plus size={14} /> Add Attachment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal logic similar to before, kept concise here due to length limits but should be present */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Task">
                <form onSubmit={handleCreateTask}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Project</label>
                            <select className="form-input form-select" required value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })}>
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-input form-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Assignee</label>
                            <select className="form-input form-select" value={formData.assignee} onChange={e => setFormData({ ...formData, assignee: e.target.value })}>
                                <option value="">Unassigned</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input type="date" className="form-input" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button type="submit">Create Task</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
