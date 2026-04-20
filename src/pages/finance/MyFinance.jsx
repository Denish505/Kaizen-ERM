import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { DollarSign, Download, Calendar, TrendingUp, FileText, CreditCard } from 'lucide-react'
import { hrmService } from '../../services/hrm.service'

export default function MyFinance() {
    const { user } = useAuth()
    const [selectedYear, setSelectedYear] = useState('2026')
    const [payslips, setPayslips] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchMySalaries()
    }, [])

    const fetchMySalaries = async () => {
        setLoading(true)
        try {
            const response = await hrmService.getMySalaries()
            setPayslips(response.data)
        } catch (err) {
            console.error("Error fetching my salaries:", err)
            setError("Failed to load salary information")
        } finally {
            setLoading(false)
        }
    }

    // Determine current/latest salary structure
    // If no payslips, use 0
    const latestSlip = payslips.length > 0 ? payslips[0] : null

    // Fallback if no data
    const mySalary = latestSlip ? {
        baseSalary: parseFloat(latestSlip.basic_salary),
        hra: parseFloat(latestSlip.hra),
        pf: parseFloat(latestSlip.pf_employee),
        netSalary: parseFloat(latestSlip.net_salary),
        grossSalary: parseFloat(latestSlip.gross_salary),
        ytd: payslips.reduce((sum, s) => sum + parseFloat(s.net_salary), 0)
    } : {
        baseSalary: 0, hra: 0, pf: 0, netSalary: 0, grossSalary: 0, ytd: 0
    }

    if (loading) return <div className="p-4">Loading financial data...</div>
    if (error) return <div className="p-4 text-red-500">{error}</div>

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Finance</h1>
                    <p className="page-subtitle">View your salary and payment history</p>
                </div>
                <select
                    className="form-input form-select"
                    style={{ width: 'auto' }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>
            </div>

            {/* Salary Overview Card */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary-900), var(--primary-800))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Monthly Net Salary</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                            ₹{mySalary.netSalary.toLocaleString('en-IN')}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>{user?.designationLabel || 'Employee'} • {user?.departmentLabel || 'Department'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Gross Salary</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{mySalary.grossSalary.toLocaleString('en-IN')}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Monthly HRA</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>₹{mySalary.hra.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-card-icon primary"><DollarSign size={24} /></div>
                    <div className="stat-card-value">₹{mySalary.baseSalary.toLocaleString('en-IN')}</div>
                    <div className="stat-card-label">Basic (Monthly)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon success"><TrendingUp size={24} /></div>
                    <div className="stat-card-value">₹{mySalary.hra.toLocaleString('en-IN')}</div>
                    <div className="stat-card-label">HRA (Monthly)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}><CreditCard size={24} /></div>
                    <div className="stat-card-value">₹{mySalary.pf.toLocaleString('en-IN')}</div>
                    <div className="stat-card-label">PF Deduction</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon warning"><Calendar size={24} /></div>
                    <div className="stat-card-value">₹{mySalary.ytd.toLocaleString('en-IN')}</div>
                    <div className="stat-card-label">YTD Earnings</div>
                </div>
            </div>

            {/* Payslips */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Payment History</h3>
                        <p className="card-subtitle">Your recent payslips</p>
                    </div>
                </div>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Month/Year</th>
                                <th>Pay Date</th>
                                <th>Net Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map(slip => (
                                <tr key={slip.id}>
                                    <td style={{ fontWeight: 500 }}>{slip.month}/{slip.year}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{slip.payment_date || 'Pending'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{parseFloat(slip.net_salary).toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className={`badge ${slip.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {slip.payment_status ? (slip.payment_status.charAt(0).toUpperCase() + slip.payment_status.slice(1)) : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Download size={14} /> Payslip
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {payslips.length === 0 && (
                    <div className="text-center p-8 text-muted">No payslip records found.</div>
                )}
            </div>
        </div>
    )
}
