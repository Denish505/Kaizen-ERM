import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { CalendarCheck, Clock, LogIn, LogOut, Users, AlertCircle, Calendar } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { getTodayIST } from '../../utils/dateUtils'

export default function Attendance() {
    const { user } = useAuth()
    const [attendanceLogs, setAttendanceLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(getTodayIST())
    const [todayRecord, setTodayRecord] = useState(null)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)

    const isManager = ['ceo', 'hr', 'project_manager', 'admin'].includes(user?.role)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const response = await hrmService.getAttendance()
            setAttendanceLogs(response.data)
            const today = getTodayIST()
            const myRecord = response.data.find(a => a.date === today)
            setTodayRecord(myRecord)
        } catch (err) {
            console.error("Failed to fetch attendance", err)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async () => {
        setCheckingIn(true)
        try {
            await hrmService.checkIn()
            toast.success('Checked in successfully!')
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-in failed')
        } finally {
            setCheckingIn(false)
        }
    }

    const handleCheckOut = async () => {
        setCheckingOut(true)
        try {
            await hrmService.checkOut()
            toast.success('Checked out successfully!')
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-out failed')
        } finally {
            setCheckingOut(false)
        }
    }

    const displayLogs = selectedDate ? attendanceLogs.filter(log => log.date === selectedDate) : attendanceLogs

    const stats = {
        present: attendanceLogs.filter(a => a.status === 'present').length,
        late: attendanceLogs.filter(a => a.status === 'late').length,
        absent: attendanceLogs.filter(a => a.status === 'absent').length,
        onLeave: attendanceLogs.filter(a => a.status === 'on_leave').length,
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header"><div className="skeleton skeleton-title" style={{ width: '250px' }} /></div>
                <SkeletonCard count={4} />
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isManager ? 'Attendance Overview' : 'My Attendance'}</h1>
                    <p className="page-subtitle">{isManager ? 'Team attendance tracking' : 'Your attendance record'}</p>
                </div>
                <div className="dashboard-date-badge">
                    <Calendar size={16} />
                    <input type="date" className="date-input-minimal" value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
            </div>

            {/* Stats for Managers */}
            {isManager && (
                <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <CalendarCheck size={22} />
                            </div>
                        </div>
                        <div className="stat-card-value">{stats.present}</div>
                        <div className="stat-card-label">Present Today</div>
                    </div>
                    <div className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                <Clock size={22} />
                            </div>
                        </div>
                        <div className="stat-card-value">{stats.late}</div>
                        <div className="stat-card-label">Late Arrivals</div>
                    </div>
                    <div className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <AlertCircle size={22} />
                            </div>
                        </div>
                        <div className="stat-card-value">{stats.absent}</div>
                        <div className="stat-card-label">Absent</div>
                    </div>
                    <div className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                                <Users size={22} />
                            </div>
                        </div>
                        <div className="stat-card-value">{stats.onLeave}</div>
                        <div className="stat-card-label">On Leave</div>
                    </div>
                </div>
            )}

            {/* Check-in/out Action Card */}
            <div className="glass-card attendance-action-card" style={{ marginBottom: '2rem' }}>
                <div className="attendance-action-header">
                    <div className="attendance-icon-wrapper">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h3>Today's Attendance</h3>
                        <p>{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="attendance-action-buttons">
                    <Button variant="success" loading={checkingIn} onClick={handleCheckIn}
                        disabled={todayRecord?.check_in} style={{ flex: 1, padding: '1rem' }}>
                        <LogIn size={20} />
                        {todayRecord?.check_in ? `Checked In at ${todayRecord.check_in}` : 'Check In'}
                    </Button>
                    <Button variant="danger" loading={checkingOut} onClick={handleCheckOut}
                        disabled={!todayRecord?.check_in || todayRecord?.check_out} style={{ flex: 1, padding: '1rem' }}>
                        <LogOut size={20} />
                        {todayRecord?.check_out ? `Checked Out at ${todayRecord.check_out}` : 'Check Out'}
                    </Button>
                </div>
                {todayRecord && (
                    <div className="attendance-status-badge">
                        Status: <span className={`badge badge-${todayRecord.status === 'present' ? 'success' : todayRecord.status === 'late' ? 'warning' : 'info'}`}>
                            {todayRecord.status}
                        </span>
                    </div>
                )}
            </div>

            {/* Attendance Table */}
            <div className="glass-card">
                <div className="card-header-modern">
                    <h3>{isManager ? 'Attendance Records' : 'My Recent Attendance'}</h3>
                </div>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                {isManager && <th>Employee</th>}
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayLogs.length > 0 ? displayLogs.map((record, idx) => (
                                <tr key={record.id} className="stagger-item" style={{ '--index': idx }}>
                                    {isManager && (
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar avatar-sm">{record.employee_name?.[0] || 'U'}</div>
                                                <div>
                                                    <span style={{ fontWeight: 500, display: 'block' }}>{record.employee_name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.department}</span>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td style={{ color: 'var(--text-muted)' }}>{record.date}</td>
                                    <td style={{ color: record.check_in ? 'var(--success)' : 'var(--text-muted)' }}>{record.check_in || '-'}</td>
                                    <td style={{ color: record.check_out ? 'var(--success)' : 'var(--text-muted)' }}>{record.check_out || '-'}</td>
                                    <td>{record.hours_worked || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : record.status === 'on_leave' ? 'info' : 'danger'}`}>
                                            {record.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Clock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No attendance records for this date</p>
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
