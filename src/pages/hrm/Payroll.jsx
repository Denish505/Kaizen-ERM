import { useState, useEffect } from 'react'
import { DollarSign, Download, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import api from '../../services/api'
import { format } from 'date-fns'
import { useAuth } from '../../App'
import { Button, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Payroll() {
    const { user } = useAuth()
    const [salaries, setSalaries] = useState([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })

    const currentDate = new Date()
    const [selectedMonth, setSelectedMonth] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)

    useEffect(() => { fetchSalaries() }, [selectedMonth])

    const fetchSalaries = async () => {
        setLoading(true)
        try {
            const params = { month: selectedMonth }
            const res = await hrmService.getSalaries(params)
            const salaryData = Array.isArray(res.data) ? res.data : []
            setSalaries(salaryData)
            calculateStats(salaryData)
        } catch (err) {
            console.error("Error fetching salaries:", err)
            toast.error("Failed to fetch payroll data")
            setSalaries([])
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data) => {
        if (!Array.isArray(data)) return
        const total = data.reduce((sum, item) => sum + parseFloat(item?.net_salary || 0), 0)
        const pendingCount = data.filter(item => item?.status === 'pending').length
        const paidCount = data.filter(item => item?.status === 'paid').length
        setStats({ total, pending: pendingCount, paid: paidCount })
    }

    const handleProcessPayroll = async () => {
        if (!confirm(`Process payroll for ${selectedMonth}?`)) return
        setProcessing(true)
        try {
            await hrmService.processSalary({ month: selectedMonth })
            toast.success('Payroll processing initiated!')
            fetchSalaries()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to process payroll')
        } finally {
            setProcessing(false)
        }
    }

    const handleDownloadSlip = async (salary) => {
        try {
            const response = await api.get(`/hrm/salaries/${salary.id}/download_slip/`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            const empName = salary.employee_name?.replace(/\s+/g, '_') || 'employee'
            link.setAttribute('download', `salary_slip_${empName}_${selectedMonth}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Salary slip downloaded!')
        } catch (err) {
            toast.error('Failed to download slip')
        }
    }

    const canProcess = ['admin', 'hr', 'accountant', 'ceo'].includes(user?.role)

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header"><div className="skeleton skeleton-title" style={{ width: '220px' }} /></div>
                <SkeletonCard count={3} />
            </div>
        )
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        try {
            return format(new Date(dateString), 'dd MMM yyyy')
        } catch (e) {
            return '-'
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll & Salaries</h1>
                    <p className="page-subtitle">Manage compensation for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="dashboard-date-badge">
                        <Calendar size={16} />
                        <input type="month" className="date-input-minimal" value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)} />
                    </div>
                    {canProcess && (
                        <Button icon={DollarSign} loading={processing} onClick={handleProcessPayroll}>
                            Process Payroll
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">₹{stats.total.toLocaleString()}</div>
                    <div className="stat-card-label">Total Payout</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <AlertCircle size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.pending}</div>
                    <div className="stat-card-label">Pending Payments</div>
                </div>
                <div className="dashboard-stat-card hover-lift">
                    <div className="stat-card-header">
                        <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                            <CheckCircle size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats.paid}</div>
                    <div className="stat-card-label">Processed Payments</div>
                </div>
            </div>

            <div className="glass-card">
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Basic</th>
                                <th>Allowances</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.length > 0 ? salaries.map((salary, idx) => {
                                const basic = parseFloat(salary?.basic_salary || 0)
                                const gross = parseFloat(salary?.gross_salary || 0)
                                const allowances = gross - basic
                                const deductions = parseFloat(salary?.total_deductions || 0)
                                const net = parseFloat(salary?.net_salary || 0)

                                return (
                                    <tr key={salary?.id || idx} className="stagger-item" style={{ '--index': idx }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm">{salary?.employee_name?.[0] || 'E'}</div>
                                                <div>
                                                    <span style={{ fontWeight: 500, display: 'block' }}>{salary?.employee_name || `Emp #${salary?.employee || 'Unknown'}`}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{salary?.designation || 'Employee'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>₹{basic.toLocaleString()}</td>
                                        <td style={{ color: 'var(--success)' }}>+₹{allowances.toLocaleString()}</td>
                                        <td style={{ color: 'var(--error)' }}>-₹{deductions.toLocaleString()}</td>
                                        <td style={{ fontWeight: 600 }}>₹{net.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge badge-${salary?.status === 'paid' ? 'success' : 'warning'}`}>
                                                {(salary?.status || 'Pending').toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {formatDate(salary?.payment_date || salary?.created_at)}
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary btn-icon" title="Download Slip" onClick={() => handleDownloadSlip(salary)}>
                                                <Download size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No payroll records found for this month</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
