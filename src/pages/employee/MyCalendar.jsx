import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../App'
import {
    Calendar, Clock, ChevronLeft, ChevronRight, LogIn, LogOut,
    CheckSquare, AlertCircle, CalendarCheck, TrendingUp
} from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import { projectsService } from '../../services/projects.service'
import { toast } from 'react-hot-toast'
import { Button, SkeletonCard } from '../../components/ui'
import { getTodayIST, nowIST } from '../../utils/dateUtils'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MyCalendar() {
    const { user } = useAuth()

    // ── Clock state ──────────────────────────────────────────────────────
    const [now, setNow] = useState(nowIST())
    const intervalRef = useRef(null)

    // ── Calendar state ────────────────────────────────────────────────────
    const [calDate, setCalDate] = useState(new Date())

    // ── Shared data ───────────────────────────────────────────────────────
    const [attendance, setAttendance] = useState([])
    const [tasks, setTasks] = useState([])
    const [leaves, setLeaves] = useState([])
    const [todayRecord, setTodayRecord] = useState(null)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState(null)

    // ── Clock ticker ─────────────────────────────────────────────────────
    useEffect(() => {
        intervalRef.current = setInterval(() => setNow(nowIST()), 1000)
        return () => clearInterval(intervalRef.current)
    }, [])

    // ── Fetch data ────────────────────────────────────────────────────────
    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [attRes, taskRes, leaveRes] = await Promise.all([
                hrmService.getMyAttendance(),
                projectsService.getTasks(),
                hrmService.getLeaves(),
            ])
            setAttendance(attRes.data)
            setTasks(taskRes.data)
            setLeaves(leaveRes.data)
            const today = getTodayIST()
            setTodayRecord(attRes.data.find(a => a.date === today) || null)
        } catch (err) {
            console.error('Failed to fetch calendar data', err)
        } finally {
            setLoading(false)
        }
    }

    // ── Check-in / out ────────────────────────────────────────────────────
    const handleCheckIn = async () => {
        setCheckingIn(true)
        try {
            await hrmService.checkIn()
            toast.success('Checked in successfully!')
            fetchData()
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail || 'Check-in failed'
            toast.error(msg)
        } finally {
            setCheckingIn(false)
        }
    }

    const handleCheckOut = async () => {
        setCheckingOut(true)
        try {
            await hrmService.checkOut()
            toast.success('Checked out!')
            fetchData()
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail || 'Check-out failed'
            toast.error(msg)
        } finally {
            setCheckingOut(false)
        }
    }

    // ── Calendar helpers ──────────────────────────────────────────────────
    const year = calDate.getFullYear()
    const month = calDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const getDateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const getDayMeta = (d) => {
        const ds = getDateStr(d)
        const att = attendance.find(a => a.date === ds)
        const dayTasks = tasks.filter(t => t.due_date === ds)
        const onLeave = leaves.find(l => l.start_date <= ds && l.end_date >= ds && l.status === 'approved')
        return { att, dayTasks, onLeave }
    }

    const prevMonth = () => setCalDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCalDate(new Date(year, month + 1, 1))

    const todayStr = getTodayIST()
    const selectedDayEvents = selectedDay ? getDayMeta(selectedDay) : null

    // ── Clock display ─────────────────────────────────────────────────────
    const h24 = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    // ── Pure clock (no check-in buttons) — used in Calendar tab ─────────
    const ClockOnly = () => (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '3rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary-400)', lineHeight: 1 }}>
                    {h24}:{minutes}:{seconds}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {todayRecord && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <span className={`badge badge-${todayRecord.status === 'present' ? 'success' : todayRecord.status === 'late' ? 'warning' : 'info'}`}>
                            Today: {todayRecord.status?.replace('_', ' ')}
                        </span>
                        {todayRecord.check_in && <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>In: {todayRecord.check_in}</span>}
                        {todayRecord.check_out && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Out: {todayRecord.check_out}</span>}
                    </div>
                )}
            </div>
        </div>
    )

    // ── Full clock + check-in widget — used in Attendance Log tab ────────
    const ClockWidget = () => (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Clock */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary-400)', lineHeight: 1 }}>
                        {String(h12).padStart(2, '0')}:{minutes}:{seconds}
                        <span style={{ fontSize: '1.1rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>{ampm}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
                        {now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Check-in / out */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        variant="success"
                        loading={checkingIn}
                        onClick={handleCheckIn}
                        disabled={!!todayRecord?.check_in}
                        style={{ minWidth: '140px' }}
                    >
                        <LogIn size={16} />
                        {todayRecord?.check_in ? `In: ${todayRecord.check_in}` : 'Check In'}
                    </Button>
                    <Button
                        variant="danger"
                        loading={checkingOut}
                        onClick={handleCheckOut}
                        disabled={!todayRecord?.check_in || !!todayRecord?.check_out}
                        style={{ minWidth: '140px' }}
                    >
                        <LogOut size={16} />
                        {todayRecord?.check_out ? `Out: ${todayRecord.check_out}` : 'Check Out'}
                    </Button>
                </div>

                {todayRecord && (
                    <span className={`badge badge-${todayRecord.status === 'present' ? 'success' : todayRecord.status === 'late' ? 'warning' : 'info'}`}>
                        Today: {todayRecord.status?.replace('_', ' ')}
                    </span>
                )}
            </div>
        </div>
    )

    if (loading) return <div className="animate-fadeIn"><SkeletonCard count={4} /></div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Calendar</h1>
                    <p className="page-subtitle">Your schedule and tasks</p>
                </div>
            </div>

            <ClockOnly />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Calendar grid */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button className="btn btn-sm btn-secondary btn-icon" onClick={prevMonth}><ChevronLeft size={16} /></button>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            {MONTHS[month]} {year}
                        </h3>
                        <button className="btn btn-sm btn-secondary btn-icon" onClick={nextMonth}><ChevronRight size={16} /></button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = i + 1
                            const ds = getDateStr(d)
                            const { att, dayTasks, onLeave } = getDayMeta(d)
                            const isToday = ds === todayStr
                            const isSelected = selectedDay === d
                            const isWeekend = [0, 6].includes(new Date(year, month, d).getDay())

                            let bg = 'transparent'
                            let color = isWeekend ? 'var(--text-muted)' : 'var(--text-primary)'
                            if (onLeave) bg = 'rgba(59,130,246,0.15)'
                            if (att?.status === 'present') bg = 'rgba(16,185,129,0.12)'
                            if (att?.status === 'late') bg = 'rgba(245,158,11,0.12)'
                            if (att?.status === 'absent') bg = 'rgba(239,68,68,0.1)'
                            if (isToday) { bg = 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'; color = 'white' }
                            if (isSelected && !isToday) { bg = 'var(--bg-card-hover)' }

                            return (
                                <div
                                    key={d}
                                    onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                                    style={{
                                        position: 'relative', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                        padding: '6px 4px', textAlign: 'center', background: bg, color,
                                        border: isSelected ? '1px solid var(--primary-500)' : '1px solid transparent',
                                        transition: 'all 0.15s', fontWeight: isToday ? 700 : 400,
                                    }}
                                    title={ds}
                                >
                                    <span style={{ fontSize: '0.85rem' }}>{d}</span>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                                        {dayTasks.length > 0 && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />}
                                        {onLeave && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }} />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        {[
                            { color: 'rgba(16,185,129,0.3)', label: 'Present' },
                            { color: 'rgba(245,158,11,0.3)', label: 'Late' },
                            { color: 'rgba(239,68,68,0.2)', label: 'Absent' },
                            { color: 'rgba(59,130,246,0.3)', label: 'On Leave' },
                            { color: 'var(--warning)', label: 'Task Due', dot: true },
                        ].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {l.dot
                                    ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                                    : <span style={{ width: '14px', height: '10px', borderRadius: '3px', background: l.color, display: 'inline-block' }} />
                                }
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Selected day detail */}
                    {selectedDay && selectedDayEvents && (
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                {MONTHS[month]} {selectedDay}, {year}
                            </h4>
                            {selectedDayEvents.att && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ATTENDANCE</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className={`badge badge-${selectedDayEvents.att.status === 'present' ? 'success' : selectedDayEvents.att.status === 'late' ? 'warning' : 'danger'}`}>
                                            {selectedDayEvents.att.status}
                                        </span>
                                        {selectedDayEvents.att.check_in && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In: {selectedDayEvents.att.check_in}</span>}
                                        {selectedDayEvents.att.check_out && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Out: {selectedDayEvents.att.check_out}</span>}
                                    </div>
                                </div>
                            )}
                            {selectedDayEvents.onLeave && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ON LEAVE</p>
                                    <span className="badge badge-info">{selectedDayEvents.onLeave.leave_type_name || 'Approved Leave'}</span>
                                </div>
                            )}
                            {selectedDayEvents.dayTasks.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>TASKS DUE</p>
                                    {selectedDayEvents.dayTasks.map(t => (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                            <CheckSquare size={13} style={{ color: 'var(--warning)' }} />
                                            <span style={{ fontSize: '0.85rem' }}>{t.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!selectedDayEvents.att && !selectedDayEvents.onLeave && selectedDayEvents.dayTasks.length === 0 && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing scheduled</p>
                            )}
                        </div>
                    )}

                    {/* Upcoming tasks */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckSquare size={16} style={{ color: 'var(--warning)' }} /> Upcoming Tasks
                        </h4>
                        {tasks.filter(t => t.due_date >= todayStr && t.status !== 'completed').slice(0, 5).map(t => (
                            <div key={t.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{t.title}</div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.due_date}</span>
                                    <span className={`badge ${t.priority === 'urgent' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{t.priority}</span>
                                </div>
                            </div>
                        ))}
                        {tasks.filter(t => t.due_date >= todayStr && t.status !== 'completed').length === 0 && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No upcoming tasks</p>
                        )}
                    </div>

                    {/* Upcoming leaves */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} style={{ color: 'var(--info)' }} /> Leaves Planned
                        </h4>
                        {leaves.filter(l => l.end_date >= todayStr).slice(0, 3).map(l => (
                            <div key={l.id} style={{ marginBottom: '0.6rem' }}>
                                <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{l.leave_type_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.start_date} → {l.end_date}</div>
                                <span className={`badge badge-${l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{l.status}</span>
                            </div>
                        ))}
                        {leaves.filter(l => l.end_date >= todayStr).length === 0 && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No planned leaves</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
