import { useState, useEffect } from 'react'
import { DollarSign, Download, TrendingUp, Calendar, FileText } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'
import api from '../../services/api'
import { SkeletonCard } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function MySalary() {
    const [salaries, setSalaries] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await hrmService.getMySalary()
            setSalaries(res.data)
        } catch (err) {
            console.error('Failed to fetch salary', err)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (v) => {
        if (!v && v !== 0) return '—'
        const n = parseFloat(v)
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
        return `₹${n.toLocaleString('en-IN')}`
    }

    const handleDownload = async (salary) => {
        try {
            const res = await api.get(`/hrm/salaries/${salary.id}/download_slip/`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `salary_slip_${salary.month}_${salary.year}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Salary slip downloaded!')
        } catch (err) {
            toast.error('Failed to download slip')
        }
    }

    const latest = salaries[0]

    const getMonthName = (m) => {
        const d = new Date(2000, m - 1, 1)
        return d.toLocaleString('en-IN', { month: 'long' })
    }

    if (loading) return <div className="animate-fadeIn"><SkeletonCard count={3} /></div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Salary</h1>
                    <p className="page-subtitle">Your compensation & payslip history</p>
                </div>
            </div>

            {/* Latest Payslip Highlight */}
            {latest && (
                <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.75rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                Latest Payslip — {getMonthName(latest.month)} {latest.year}
                            </p>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-400)', lineHeight: 1 }}>
                                {formatCurrency(latest.net_salary)}
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>Net Take-home</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Gross', value: formatCurrency(latest.gross_salary), color: 'var(--success)' },
                                { label: 'Deductions', value: formatCurrency(latest.total_deductions), color: 'var(--error)' },
                                { label: 'Basic', value: formatCurrency(latest.basic_salary), color: 'var(--text-secondary)' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${latest.payment_status === 'paid' ? 'success' : latest.payment_status === 'processed' ? 'info' : 'warning'}`}>
                            {latest.payment_status || 'pending'}
                        </span>
                        {latest.payment_date && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Calendar size={13} /> Paid on {latest.payment_date}
                            </span>
                        )}
                        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => handleDownload(latest)}>
                            <Download size={14} /> Download Slip
                        </button>
                    </div>
                </div>
            )}

            {/* Monthly summary stats */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Latest Net Salary', value: formatCurrency(latest?.net_salary), icon: <DollarSign size={20} />, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.15)' },
                    { label: 'Gross Salary', value: formatCurrency(latest?.gross_salary), icon: <TrendingUp size={20} />, color: 'var(--success)', bg: 'var(--success-bg)' },
                    { label: 'Total Deductions', value: formatCurrency(latest?.total_deductions), icon: <FileText size={20} />, color: 'var(--error)', bg: 'var(--error-bg)' },
                    { label: 'Payslips Count', value: salaries.length, icon: <Calendar size={20} />, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                ].map(s => (
                    <div key={s.label} className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        </div>
                        <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Payslip history */}
            <div className="glass-card">
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Payslip History</div>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Basic</th>
                                <th>Gross</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                                <th>Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.length > 0 ? salaries.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{getMonthName(s.month)} {s.year}</td>
                                    <td>{formatCurrency(s.basic_salary)}</td>
                                    <td>{formatCurrency(s.gross_salary)}</td>
                                    <td style={{ color: 'var(--error)' }}>{formatCurrency(s.total_deductions)}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{formatCurrency(s.net_salary)}</td>
                                    <td>
                                        <span className={`badge badge-${s.payment_status === 'paid' ? 'success' : s.payment_status === 'processed' ? 'info' : 'warning'}`}>
                                            {s.payment_status || 'pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-secondary btn-icon" title="Download Slip" onClick={() => handleDownload(s)}>
                                            <Download size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <DollarSign size={40} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                                        No payslips available yet
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
