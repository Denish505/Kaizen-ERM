import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import {
    Users, FolderKanban, TrendingUp, DollarSign,
    CheckCircle2, Clock, Calendar, Target, ArrowRight, Sparkles,
    Briefcase, Receipt, AlertCircle, ChevronRight, CheckSquare,
    CalendarCheck, CalendarOff, Activity, Zap, BarChart2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { dashboardService } from '../services/dashboard.service'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'
import { SkeletonCard } from '../components/ui'
import PageTransition from '../components/common/PageTransition'
import { getCurrentHourIST } from '../utils/dateUtils'

// ─── helpers ──────────────────────────────────────────────────────────────────
const ICON_MAP = {
    Users, FolderKanban, DollarSign, TrendingUp, CheckCircle2,
    Clock, Calendar, Target, CheckSquare, CalendarCheck, CalendarOff,
    Receipt, AlertCircle, Activity,
}

const GRADIENT = {
    Revenue: 'linear-gradient(135deg,#10b981,#059669)',
    Project: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    Employee: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    Task: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    Salary: 'linear-gradient(135deg,#10b981,#059669)',
    Leave: 'linear-gradient(135deg,#f59e0b,#d97706)',
    Alert: 'linear-gradient(135deg,#ef4444,#dc2626)',
    Neutral: 'linear-gradient(135deg,#64748b,#475569)',
}

const g = (title) => {
    if (/Revenue|FY|Profit|Net|Salary|Payroll/.test(title)) return GRADIENT.Revenue
    if (/Project/.test(title)) return GRADIENT.Project
    if (/Employee|Active|Head/.test(title)) return GRADIENT.Employee
    if (/Task|Completed|Progress/.test(title)) return GRADIENT.Task
    if (/Leave|Upcoming/.test(title)) return GRADIENT.Leave
    if (/Overdue|Pending|Invoice/.test(title)) return GRADIENT.Alert
    return GRADIENT.Neutral
}

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }
const STATUS_BADGE = {
    todo: 'badge-secondary',
    in_progress: 'badge-info',
    review: 'badge-warning',
    completed: 'badge-success',
}

const fade = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }

function StatCard({ stat }) {
    const Icon = ICON_MAP[stat.icon] || Target
    return (
        <motion.div variants={fade} className="dashboard-stat-card hover-lift">
            <div className="stat-card-header">
                <div className="stat-card-icon-wrapper" style={{ background: g(stat.title) }}>
                    <Icon size={22} />
                </div>
                {stat.trend && stat.trend !== 'neutral' && (
                    <span className={`stat-trend ${stat.trend}`}>{stat.change}</span>
                )}
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.title}</div>
            {stat.change && stat.trend === 'neutral' && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{stat.change}</div>
            )}
        </motion.div>
    )
}

function SectionCard({ title, link, linkLabel = 'View All', children }) {
    return (
        <div className="glass-card">
            <div className="card-header-modern">
                <h3>{title}</h3>
                {link && <Link to={link} className="card-link">{linkLabel} <ChevronRight size={16} /></Link>}
            </div>
            <div className="recent-list">{children}</div>
        </div>
    )
}

function ProjectItem({ p }) {
    const statusColor = { in_progress: 'var(--info)', completed: 'var(--success)', on_hold: 'var(--warning)', planning: 'var(--text-muted)' }
    return (
        <div className="recent-item">
            <div className="recent-item-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                <FolderKanban size={16} />
            </div>
            <div className="recent-item-content">
                <span className="recent-item-title">{p.name}</span>
                <span className="recent-item-subtitle">{p.client}</span>
            </div>
            <div className="recent-item-meta" style={{ minWidth: '90px' }}>
                <div className="progress-bar-mini">
                    <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="progress-text">{p.progress}%</span>
            </div>
        </div>
    )
}

function TaskItem({ t }) {
    return (
        <div className="recent-item">
            <div className="priority-dot" style={{ background: PRIORITY_COLORS[t.priority] || '#94a3b8', width: 10, height: 10, borderRadius: '50%', flexShrink: 0 }} />
            <div className="recent-item-content">
                <span className="recent-item-title">{t.title}</span>
                <span className="recent-item-subtitle">{t.project}{t.assignee ? ` · ${t.assignee}` : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span className={`badge ${STATUS_BADGE[t.status] || 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                    {t.status?.replace('_', ' ')}
                </span>
                <span className="recent-item-date">{t.dueDate}</span>
            </div>
        </div>
    )
}

function EmptyMini({ icon: Icon = AlertCircle, msg }) {
    return (
        <div className="empty-state-mini">
            <Icon size={32} />
            <p>{msg}</p>
        </div>
    )
}

// ─── CEO ──────────────────────────────────────────────────────────────────────
function CEODashboard({ data, user }) {
    return (
        <>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="dashboard-stats-grid">
                {data.stats.map((s, i) => <StatCard key={i} stat={s} />)}
            </motion.div>

            <div className="dashboard-charts-grid">
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Monthly Revenue</h3>
                            <p className="chart-subtitle">Paid invoices — last 12 months</p>
                        </div>
                        <div className="chart-badge success"><TrendingUp size={14} /><span>FY</span></div>
                    </div>
                    {data.revenueTrend?.length > 0
                        ? <AreaChart data={data.revenueTrend} height={260} />
                        : <EmptyMini msg="No revenue data yet" />}
                </div>
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">Task Distribution</h3><p className="chart-subtitle">All tasks across projects</p></div>
                    </div>
                    {data.taskDistribution?.length > 0
                        ? <DonutChart data={data.taskDistribution} height={260} />
                        : <EmptyMini msg="No tasks yet" />}
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                    {[
                        { to: '/hrm/employees', label: 'Team Members', Icon: Users, bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
                        { to: '/projects', label: 'Projects', Icon: Briefcase, bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
                        { to: '/finance/invoices', label: 'Invoices', Icon: Receipt, bg: 'linear-gradient(135deg,#10b981,#047857)' },
                        { to: '/hrm/leave-requests', label: 'Leave Requests', Icon: Calendar, bg: 'linear-gradient(135deg,#f59e0b,#b45309)' },
                        { to: '/hrm/employee-tasks', label: 'Employee Tasks', Icon: CheckSquare, bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
                        { to: '/analytics', label: 'Analytics', Icon: BarChart2, bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
                    ].map(({ to, label, Icon, bg }) => (
                        <Link key={to} to={to} className="quick-action-card hover-lift">
                            <div className="quick-action-icon" style={{ background: bg }}><Icon size={22} /></div>
                            <span>{label}</span>
                            <ChevronRight size={16} className="quick-action-arrow" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="dashboard-recent-grid">
                <SectionCard title="Recent Projects" link="/projects">
                    {data.recentProjects?.length > 0
                        ? data.recentProjects.map(p => <ProjectItem key={p.id} p={p} />)
                        : <EmptyMini Icon={FolderKanban} msg="No recent projects" />}
                </SectionCard>
                <SectionCard title="Top Clients by Revenue" link="/clients">
                    {data.clientRevenue?.length > 0
                        ? data.clientRevenue.map((c, i) => (
                            <div key={i} className="recent-item">
                                <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#10b981,#047857)', color: 'white' }}>{c.name?.charAt(0)}</div>
                                <div className="recent-item-content"><span className="recent-item-title">{c.name}</span></div>
                                <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.875rem' }}>
                                    ₹{(c.value / 100000).toFixed(1)}L
                                </span>
                            </div>
                        ))
                        : <EmptyMini Icon={Receipt} msg="No paid invoices yet" />}
                </SectionCard>
            </div>
        </>
    )
}

// ─── HR ───────────────────────────────────────────────────────────────────────
function HRDashboard({ data }) {
    return (
        <>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="dashboard-stats-grid">
                {data.stats.map((s, i) => <StatCard key={i} stat={s} />)}
            </motion.div>

            <div className="dashboard-charts-grid">
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">New Joinings</h3><p className="chart-subtitle">Monthly headcount additions</p></div>
                    </div>
                    {data.revenueTrend?.length > 0
                        ? <AreaChart data={data.revenueTrend} color="#10b981" height={260} />
                        : <EmptyMini msg="Not enough joining data" />}
                </div>
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">Dept. Headcount</h3><p className="chart-subtitle">Active employees by department</p></div>
                    </div>
                    {data.taskDistribution?.length > 0
                        ? <DonutChart data={data.taskDistribution} height={260} />
                        : <EmptyMini msg="No department data" />}
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                    {[
                        { to: '/hrm/employees', label: 'Employees', Icon: Users, bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
                        { to: '/hrm/attendance', label: 'Attendance', Icon: CalendarCheck, bg: 'linear-gradient(135deg,#10b981,#047857)' },
                        { to: '/hrm/leave-requests', label: 'Leave Requests', Icon: CalendarOff, bg: 'linear-gradient(135deg,#f59e0b,#b45309)' },
                        { to: '/finance/salaries', label: 'Payroll', Icon: DollarSign, bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
                        { to: '/hrm/employee-tasks', label: 'Task Overview', Icon: CheckSquare, bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
                        { to: '/hrm/performance-reviews', label: 'Reviews', Icon: Target, bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
                    ].map(({ to, label, Icon, bg }) => (
                        <Link key={to} to={to} className="quick-action-card hover-lift">
                            <div className="quick-action-icon" style={{ background: bg }}><Icon size={22} /></div>
                            <span>{label}</span>
                            <ChevronRight size={16} className="quick-action-arrow" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="dashboard-recent-grid">
                <SectionCard title="Pending Leave Requests" link="/hrm/leave-requests" linkLabel="Manage">
                    {data.recentLeaves?.length > 0
                        ? data.recentLeaves.map(l => (
                            <div key={l.id} className="recent-item">
                                <div className="avatar avatar-sm">{l.employee?.charAt(0)}</div>
                                <div className="recent-item-content">
                                    <span className="recent-item-title">{l.employee}</span>
                                    <span className="recent-item-subtitle">{l.type} · {l.days} day{l.days !== 1 ? 's' : ''}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                    <div>{l.from}</div>
                                    <div>→ {l.to}</div>
                                </div>
                            </div>
                        ))
                        : <EmptyMini Icon={CalendarOff} msg="No pending leave requests 🎉" />}
                </SectionCard>
                <SectionCard title="IT ERP Highlights">
                    {[
                        { label: 'Employee Self-Service', desc: 'Staff can view payslips & leaves', link: '/my/salary', Icon: DollarSign, color: 'var(--success)' },
                        { label: 'Task Tracking', desc: 'Assign & monitor responsibilities', link: '/hrm/employee-tasks', Icon: CheckSquare, color: 'var(--primary-400)' },
                        { label: 'Attendance Tracking', desc: 'Real-time check-in / check-out', link: '/hrm/attendance', Icon: CalendarCheck, color: 'var(--info)' },
                        { label: 'Performance Reviews', desc: 'Quarterly review cycles', link: '/hrm/performance-reviews', Icon: Target, color: 'var(--warning)' },
                    ].map(({ label, desc, link, Icon, color }) => (
                        <Link key={link} to={link} className="recent-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="stat-card-icon-wrapper" style={{ background: `${color}22`, color, width: 36, height: 36, borderRadius: 10 }}>
                                <Icon size={18} />
                            </div>
                            <div className="recent-item-content">
                                <span className="recent-item-title">{label}</span>
                                <span className="recent-item-subtitle">{desc}</span>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                    ))}
                </SectionCard>
            </div>
        </>
    )
}

// ─── Project Manager ──────────────────────────────────────────────────────────
function PMDashboard({ data }) {
    return (
        <>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="dashboard-stats-grid">
                {data.stats.map((s, i) => <StatCard key={i} stat={s} />)}
            </motion.div>

            <div className="dashboard-charts-grid">
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">Project Progress</h3><p className="chart-subtitle">Completion rate per project</p></div>
                    </div>
                    {data.revenueTrend?.length > 0
                        ? <AreaChart data={data.revenueTrend} color="#8b5cf6" height={260} />
                        : <EmptyMini msg="No projects assigned yet" />}
                </div>
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">Task Status</h3><p className="chart-subtitle">Team task distribution</p></div>
                    </div>
                    {data.taskDistribution?.length > 0
                        ? <DonutChart data={data.taskDistribution} height={260} />
                        : <EmptyMini msg="No tasks yet" />}
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                    {[
                        { to: '/projects', label: 'My Projects', Icon: FolderKanban, bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
                        { to: '/projects/tasks', label: 'Project Tasks', Icon: CheckSquare, bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
                        { to: '/hrm/employee-tasks', label: 'Team Tasks', Icon: Users, bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
                        { to: '/clients', label: 'Clients', Icon: Briefcase, bg: 'linear-gradient(135deg,#10b981,#047857)' },
                        { to: '/hrm/leave-requests', label: 'Team Leaves', Icon: CalendarOff, bg: 'linear-gradient(135deg,#f59e0b,#b45309)' },
                        { to: '/my/tasks', label: 'My Tasks', Icon: Target, bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
                    ].map(({ to, label, Icon, bg }) => (
                        <Link key={to} to={to} className="quick-action-card hover-lift">
                            <div className="quick-action-icon" style={{ background: bg }}><Icon size={22} /></div>
                            <span>{label}</span>
                            <ChevronRight size={16} className="quick-action-arrow" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="dashboard-recent-grid">
                <SectionCard title="My Projects" link="/projects">
                    {data.recentProjects?.length > 0
                        ? data.recentProjects.map(p => <ProjectItem key={p.id} p={p} />)
                        : <EmptyMini Icon={FolderKanban} msg="No projects assigned to you" />}
                </SectionCard>
                <SectionCard title="Team — Upcoming Tasks" link="/hrm/employee-tasks">
                    {data.pendingTasks?.length > 0
                        ? data.pendingTasks.map(t => <TaskItem key={t.id} t={t} />)
                        : <EmptyMini Icon={CheckCircle2} msg="All tasks on track!" />}
                </SectionCard>
            </div>
        </>
    )
}

// ─── Employee ─────────────────────────────────────────────────────────────────
function EmployeeDashboard({ data }) {
    const att = data.todayAttendance
    const sal = data.salaryInfo
    const lv = data.leaveBalance || {}

    return (
        <>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="dashboard-stats-grid">
                {data.stats.map((s, i) => <StatCard key={i} stat={s} />)}
            </motion.div>

            {/* Attendance + Salary + Leave summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Today's Attendance */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <CalendarCheck size={18} style={{ color: 'var(--success)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Today's Attendance</span>
                    </div>
                    {att ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                <span className={`badge ${att.status === 'present' ? 'badge-success' : att.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}>{att.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Check-in</span>
                                <span>{att.check_in?.slice(0, 5) || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Check-out</span>
                                <span>{att.check_out?.slice(0, 5) || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Hours</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{att.hours?.toFixed(1)}h</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No attendance marked today</div>
                    )}
                    <Link to="/my/attendance" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                        View history →
                    </Link>
                </div>

                {/* Leave Balance */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <CalendarOff size={18} style={{ color: 'var(--warning)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Leave Balance</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                        {[['Casual', lv.casual ?? '—'], ['Sick', lv.sick ?? '—'], ['Earned', lv.earned ?? '—']].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                <span style={{ fontWeight: 600, color: Number(v) > 0 ? 'var(--success)' : 'var(--error)' }}>{v} days</span>
                            </div>
                        ))}
                        {lv.pending > 0 && (
                            <div style={{ marginTop: '0.3rem', padding: '0.35rem 0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, color: 'var(--warning)', fontSize: '0.75rem' }}>
                                {lv.pending} leave request pending approval
                            </div>
                        )}
                    </div>
                    <Link to="/hrm/leave-requests" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                        Apply for leave →
                    </Link>
                </div>

                {/* Salary Peek */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <DollarSign size={18} style={{ color: 'var(--success)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Latest Salary</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Month</span>
                            <span>{sal.month} {sal.year || ''}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Net Pay</span>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{sal.net}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Status</span>
                            <span className={`badge ${sal.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{sal.status}</span>
                        </div>
                    </div>
                    <Link to="/my/salary" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                        View & download →
                    </Link>
                </div>
            </div>

            <div className="dashboard-charts-grid">
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">My Task Breakdown</h3><p className="chart-subtitle">Distribution of your tasks</p></div>
                    </div>
                    {data.taskDistribution?.some(d => d.value > 0)
                        ? <DonutChart data={data.taskDistribution.filter(d => d.value > 0)} height={260} />
                        : <EmptyMini msg="No tasks assigned yet" />}
                </div>
                <div className="glass-card dashboard-chart-card">
                    <div className="chart-header">
                        <div><h3 className="chart-title">My Upcoming Tasks</h3><p className="chart-subtitle">Ordered by due date</p></div>
                    </div>
                    <div className="recent-list">
                        {data.pendingTasks?.length > 0
                            ? data.pendingTasks.map(t => <TaskItem key={t.id} t={t} />)
                            : <EmptyMini Icon={CheckCircle2} msg="All caught up! 🎉" />}
                    </div>
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <h3 className="section-title">My Workspace</h3>
                <div className="quick-actions-grid">
                    {[
                        { to: '/my/tasks', label: 'My Tasks', Icon: CheckSquare, bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
                        { to: '/my/attendance', label: 'My Attendance', Icon: CalendarCheck, bg: 'linear-gradient(135deg,#10b981,#047857)' },
                        { to: '/my/salary', label: 'My Salary', Icon: DollarSign, bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
                        { to: '/my/calendar', label: 'My Calendar', Icon: Calendar, bg: 'linear-gradient(135deg,#f59e0b,#b45309)' },
                        { to: '/hrm/leave-requests', label: 'Apply Leave', Icon: CalendarOff, bg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
                        { to: '/my/performance', label: 'Performance', Icon: Target, bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
                    ].map(({ to, label, Icon, bg }) => (
                        <Link key={to} to={to} className="quick-action-card hover-lift">
                            <div className="quick-action-icon" style={{ background: bg }}><Icon size={22} /></div>
                            <span>{label}</span>
                            <ChevronRight size={16} className="quick-action-arrow" />
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        dashboardService.getDashboardData()
            .then(res => setData(res.data))
            .catch(err => {
                console.error(err)
                setError('Failed to load dashboard')
            })
            .finally(() => setLoading(false))
    }, [])

    const getGreeting = () => {
        const h = getCurrentHourIST()
        if (h < 12) return 'Good Morning'
        if (h < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const role = user?.role || 'employee'
    const roleLabel = {
        ceo: '— CEO Overview', hr: '— HR Dashboard',
        project_manager: '— Project Manager', stakeholder: '— Stakeholder'
    }[role] || '— My Workspace'

    if (loading) return (
        <div className="dashboard-wrapper animate-fadeIn">
            <div className="dashboard-bg">
                <div className="dashboard-orb dashboard-orb-1" /><div className="dashboard-orb dashboard-orb-2" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="skeleton skeleton-title" style={{ width: 300, marginBottom: '2rem' }} />
                <SkeletonCard count={4} />
            </div>
        </div>
    )

    return (
        <PageTransition>
            <div className="dashboard-wrapper">
                <div className="dashboard-bg">
                    <div className="dashboard-orb dashboard-orb-1" /><div className="dashboard-orb dashboard-orb-2" />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <div className="dashboard-header">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="dashboard-welcome">
                            <div className="dashboard-welcome-icon"><Sparkles size={28} /></div>
                            <div>
                                <h1 className="dashboard-title">
                                    {getGreeting()}, <span className="gradient-text">{user?.first_name || 'User'}</span>! 👋
                                </h1>
                                <p className="dashboard-subtitle">Dashboard {roleLabel}</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dashboard-header-actions">
                            <div className="dashboard-date-badge">
                                <Calendar size={16} />
                                <span>{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <Link to="/reports" className="btn btn-primary">
                                <span>Reports</span><ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', color: 'var(--error)' }}>
                            ⚠️ {error} — showing cached data
                        </div>
                    )}

                    {/* Role-specific dashboard */}
                    {data && role === 'ceo' && <CEODashboard data={data} user={user} />}
                    {data && role === 'hr' && <HRDashboard data={data} />}
                    {data && (role === 'project_manager' || role === 'stakeholder') && <PMDashboard data={data} />}
                    {data && !['ceo', 'hr', 'project_manager', 'stakeholder'].includes(role) && <EmployeeDashboard data={data} />}
                </div>
            </div>
        </PageTransition>
    )
}
