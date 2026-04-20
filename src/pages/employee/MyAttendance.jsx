import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { CalendarCheck, Clock, LogIn, LogOut, TrendingUp, AlertCircle, Calendar } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { Button, SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'
import { getTodayIST } from '../../utils/dateUtils'

export default function MyAttendance() {
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [todayRecord, setTodayRecord] = useState(null)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)

    // Default to the current year
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())

    useEffect(() => { fetchData() }, [yearFilter])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await hrmService.getMyAttendance()
            const myLogs = res.data
            setLogs(myLogs)
            const today = getTodayIST()
            setTodayRecord(myLogs.find(a => a.date === today) || null)
        } catch (err) {
            console.error('Failed to fetch attendance', err)
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

    // Filter by selected year
    const filteredLogs = logs.filter(l => l.date?.startsWith(yearFilter)).sort((a, b) => b.date.localeCompare(a.date))

    const stats = {
        present: filteredLogs.filter(l => l.status === 'present').length,
        late: filteredLogs.filter(l => l.status === 'late').length,
        absent: filteredLogs.filter(l => l.status === 'absent').length,
        onLeave: filteredLogs.filter(l => l.status === 'on_leave').length,
        totalHours: filteredLogs.reduce((sum, l) => sum + parseFloat(l.hours_worked || 0), 0).toFixed(1),
    }

    // Monthly breakdown
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const monthStr = `${yearFilter}-${String(i + 1).padStart(2, '0')}`
        const monthLogs = filteredLogs.filter(l => l.date?.startsWith(monthStr))
        return {
            month: new Date(yearFilter, i, 1).toLocaleString('default', { month: 'short' }),
            present: monthLogs.filter(l => l.status === 'present').length,
            late: monthLogs.filter(l => l.status === 'late').length,
            absent: monthLogs.filter(l => l.status === 'absent').length,
            onLeave: monthLogs.filter(l => l.status === 'on_leave').length,
            totalHours: monthLogs.reduce((sum, l) => sum + parseFloat(l.hours_worked || 0), 0).toFixed(1)
        }
    })

    if (loading) return <div className="animate-fadeIn"><SkeletonCard count={4} /></div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Attendance (Yearly)</h1>
                    <p className="page-subtitle">Your personal attendance record for the entire year</p>
                </div>
                <select
                    className="form-input form-select"
                    style={{ width: 'auto', fontWeight: 600 }}
                    value={yearFilter}
                    onChange={e => setYearFilter(e.target.value)}
                >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>
            </div>

            {/* Today's Context Widget */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '1rem' }}>Today's Status</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            {todayRecord && (
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                    <span className={`badge badge-${todayRecord.status === 'present' ? 'success' : todayRecord.status === 'late' ? 'warning' : 'info'}`}>
                                        {todayRecord.status?.replace('_', ' ')}
                                    </span>
                                    {(todayRecord.check_in || todayRecord.check_out) && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                                            {todayRecord.check_in && <span>In: {todayRecord.check_in} (GMT+5:30)</span>}
                                            {todayRecord.check_out && <span>Out: {todayRecord.check_out} (GMT+5:30)</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Button variant="success" loading={checkingIn} onClick={handleCheckIn} disabled={!!todayRecord?.check_in}>
                            <LogIn size={16} />
                            Check In
                        </Button>
                        <Button variant="danger" loading={checkingOut} onClick={handleCheckOut}
                            disabled={!todayRecord?.check_in || !!todayRecord?.check_out}>
                            <LogOut size={16} />
                            Check Out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Yearly Stats */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Yearly Summary ({yearFilter})</h3>
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Present', value: stats.present, color: 'var(--success)', bg: 'var(--success-bg)', icon: <CalendarCheck size={20} /> },
                    { label: 'Late', value: stats.late, color: 'var(--warning)', bg: 'var(--warning-bg)', icon: <Clock size={20} /> },
                    { label: 'Absent', value: stats.absent, color: 'var(--error)', bg: 'var(--error-bg)', icon: <AlertCircle size={20} /> },
                    { label: 'Total Hours', value: `${stats.totalHours}h`, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.15)', icon: <TrendingUp size={20} /> },
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

            {/* Monthly Breakdown */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Monthly Breakdown</h3>
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Present / Late</th>
                                <th>Absent</th>
                                <th>On Leave</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyStats.map(m => (
                                <tr key={m.month}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.month}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--success)', fontWeight: 500 }}>{m.present}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>/</span>
                                            <span style={{ color: 'var(--warning)', fontWeight: 500 }}>{m.late}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: m.absent > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{m.absent}</td>
                                    <td style={{ color: m.onLeave > 0 ? 'var(--info)' : 'var(--text-muted)' }}>{m.onLeave}</td>
                                    <td style={{ fontWeight: 500 }}>{m.totalHours > 0 ? `${m.totalHours}h` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* detailed Recent Log Table */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Recent Records ({yearFilter})</h3>
            <div className="glass-card">
                <div className="table-container" style={{ border: 'none', maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table">
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length > 0 ? filteredLogs.map(r => {
                                const dayName = r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }) : ''
                                const isWeekend = ['Sat', 'Sun'].includes(dayName)
                                return (
                                    <tr key={r.id} style={{ opacity: isWeekend ? 0.6 : 1 }}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{r.date}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dayName}</td>
                                        <td style={{ color: r.check_in ? 'var(--success)' : 'var(--text-muted)' }}>{r.check_in || '—'}</td>
                                        <td style={{ color: r.check_out ? 'var(--success)' : 'var(--text-muted)' }}>{r.check_out || '—'}</td>
                                        <td style={{ fontWeight: 500 }}>{r.hours_worked ? `${r.hours_worked}h` : '—'}</td>
                                        <td>
                                            <span className={`badge badge-${r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : r.status === 'on_leave' ? 'info' : 'danger'}`}>
                                                {r.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Calendar size={40} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                                        No attendance records for {yearFilter}
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
