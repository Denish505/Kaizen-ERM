import { useState, useEffect } from 'react'
import { Star, Plus, User, Calendar, MessageSquare, Loader, X, Filter } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { format } from 'date-fns'
import { useAuth } from '../../App'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function PerformanceReviews() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filterEmployee, setFilterEmployee] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        employee: '',
        review_period_start: '',
        review_period_end: '',
        rating: 3,
        comments: '',
        goals: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [reviewsRes, empRes] = await Promise.all([
                hrmService.getPerformanceReviews(),
                hrmService.getEmployees()
            ])
            setReviews(reviewsRes.data)
            setEmployees(empRes.data)
        } catch (err) {
            console.error("Failed to fetch data", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await hrmService.createPerformanceReview(formData)
            toast.success('Performance review submitted successfully')
            setShowModal(false)
            fetchData()
            // Reset form
            setFormData({
                employee: '',
                review_period_start: '',
                review_period_end: '',
                rating: 3,
                comments: '',
                goals: ''
            })
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit review')
        }
    }

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-yellow-500'
        if (rating >= 3) return 'text-blue-500'
        return 'text-red-500'
    }

    const filteredReviews = filterEmployee
        ? reviews.filter(r => r.employee === parseInt(filterEmployee))
        : reviews

    if (loading) return <div className="loading-state"><Loader className="animate-spin" /> Loading Reviews...</div>

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Reviews</h1>
                    <p className="page-subtitle">Track and evaluate employee performance</p>
                </div>
                {['admin', 'hr', 'manager'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> New Review
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        className="form-input form-select max-w-xs"
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-2 gap-6">
                {filteredReviews.map(review => {
                    const emp = employees.find(e => e.id === review.employee)
                    return (
                        <div key={review.id} className="card p-6 hover-lift relative overflow-hidden">
                            {/* Decorative header */}
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-500 to-primary-600"></div>

                            <div className="flex justify-between items-start mb-4 pl-4">
                                <div className="flex items-center gap-3">
                                    <div className="avatar bg-gray-100 text-gray-600">
                                        {emp ? emp.first_name[0] : <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee'}</h3>
                                        <p className="text-sm text-gray-500">{emp?.designation || 'Employee'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                size={16}
                                                className={star <= review.rating ? "fill-current text-yellow-500" : "text-gray-300"}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                        {review.rating}/5 Rating
                                    </span>
                                </div>
                            </div>

                            <div className="pl-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg inline-flex">
                                    <Calendar size={14} />
                                    <span>
                                        Period: {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                                    </span>
                                </div>

                                <div>
                                    <h5 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                        <MessageSquare size={14} /> Managers Comments
                                    </h5>
                                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        "{review.comments}"
                                    </p>
                                </div>

                                {review.goals && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-gray-700 mb-1">Goals for next period</h5>
                                        <p className="text-gray-600 text-sm">{review.goals}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredReviews.length === 0 && (
                <div className="empty-state">
                    <Star size={48} className="text-gray-300 mb-4" />
                    <h3>No reviews found</h3>
                    <p>Select a different filter or create a new performance review.</p>
                </div>
            )}

            {/* New Review Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Performance Review">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Employee</label>
                        <select
                            className="form-input form-select" required
                            value={formData.employee}
                            onChange={e => setFormData({ ...formData, employee: e.target.value })}
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.designation}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Period Start</label>
                            <input
                                type="date" className="form-input" required
                                value={formData.review_period_start}
                                onChange={e => setFormData({ ...formData, review_period_start: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Period End</label>
                            <input
                                type="date" className="form-input" required
                                value={formData.review_period_end}
                                onChange={e => setFormData({ ...formData, review_period_end: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Rating (1-5)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="range" min="1" max="5"
                                className="w-full"
                                value={formData.rating}
                                onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                            />
                            <span className="text-xl font-bold text-primary-600">{formData.rating}/5</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Poor</span>
                            <span>Average</span>
                            <span>Excellent</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Comments</label>
                        <textarea
                            className="form-input h-24" required
                            placeholder="Detailed feedback on performance..."
                            value={formData.comments}
                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Future Goals</label>
                        <textarea
                            className="form-input h-20"
                            placeholder="Goals set for the next period..."
                            value={formData.goals}
                            onChange={e => setFormData({ ...formData, goals: e.target.value })}
                        />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Submit Review</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
