import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { TrendingUp, DollarSign, Users, FolderKanban, Target, ArrowUpRight, ArrowDownRight, Loader2, Calendar } from 'lucide-react'
import { analyticsService } from '../services/analytics.service'
import StatCard from '../components/common/StatCard'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'

export default function Analytics() {
    const { user } = useAuth()
    const currentYear = new Date().getFullYear()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedYear, setSelectedYear] = useState(currentYear)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await analyticsService.getAnalyticsData(selectedYear)
                setData(response.data)
            } catch (err) {
                console.error("Failed to load analytics", err)
                setError(err.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [selectedYear])

    const formatCurrency = (value) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
        return `₹${parseFloat(value).toLocaleString('en-IN')}`
    }

    // Only CEO and Stakeholders can view
    const canView = ['ceo', 'stakeholder', 'admin'].includes(user?.role)

    if (!canView) {
        return (
            <div className="animate-fadeIn">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <TrendingUp size={64} className="text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700">Access Restricted</h2>
                    <p className="text-gray-500">Analytics are only available for executives.</p>
                </div>
            </div>
        )
    }

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>

    if (error) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
            <div className="text-red-500 mb-2">Failed to load data</div>
            <div className="text-sm text-gray-500">{error}</div>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
                Retry
            </button>
        </div>
    )

    if (!data) return <div className="text-center p-8">No data available</div>

    const getIcon = (title) => {
        if (title.includes('Revenue') || title.includes('Profit') || title.includes('Value')) return DollarSign
        if (title.includes('Employee')) return Users
        if (title.includes('Project')) return FolderKanban
        if (title.includes('Client')) return Target
        return TrendingUp
    }

    const getColor = (title) => {
        if (title.includes('Revenue')) return 'success'
        if (title.includes('Project')) return 'warning'
        if (title.includes('Employee')) return 'info'
        return 'primary'
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Executive Overview</h1>
                    <p className="page-subtitle">Real-time performance metrics and financial insights</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="dashboard-date-badge">
                        <Calendar size={16} />
                        <select
                            className="date-input-minimal bg-transparent border-0 focus:ring-0 cursor-pointer"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            <option value={currentYear}>FY {currentYear - 1}-{String(currentYear).slice(-2)}</option>
                            <option value={currentYear - 1}>FY {currentYear - 2}-{String(currentYear - 1).slice(-2)}</option>
                            <option value={currentYear - 2}>FY {currentYear - 3}-{String(currentYear - 2).slice(-2)}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="dashboard-stats-grid mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {data.kpis.map((kpi, index) => (
                    <div key={index} className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className={`stat-card-icon-wrapper`} style={{
                                background: getColor(kpi.title) === 'success' ? 'var(--success-bg)' :
                                    getColor(kpi.title) === 'warning' ? 'var(--warning-bg)' :
                                        getColor(kpi.title) === 'info' ? 'var(--info-bg)' : 'var(--primary-100)',
                                color: getColor(kpi.title) === 'success' ? 'var(--success)' :
                                    getColor(kpi.title) === 'warning' ? 'var(--warning)' :
                                        getColor(kpi.title) === 'info' ? 'var(--info)' : 'var(--primary-600)',
                            }}>
                                {getIcon(kpi.title) === DollarSign ? <DollarSign size={20} /> :
                                    getIcon(kpi.title) === Users ? <Users size={20} /> :
                                        getIcon(kpi.title) === FolderKanban ? <FolderKanban size={20} /> :
                                            getIcon(kpi.title) === Target ? <Target size={20} /> : <TrendingUp size={20} />}
                            </div>
                            {kpi.change && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {kpi.trend === 'up' ? '+' : ''}{kpi.change}%
                                </span>
                            )}
                        </div>
                        <div className="stat-card-value text-2xl">
                            {['Annual Revenue', 'Net Profit'].includes(kpi.title) 
                                ? formatCurrency(kpi.value) 
                                : kpi.value
                            }
                        </div>
                        <div className="stat-card-label">{kpi.title}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Revenue Trend</h3>
                            <p className="text-sm text-gray-500">Monthly financial performance</p>
                        </div>
                        <span className="badge badge-success">
                            +12.5% YoY
                        </span>
                    </div>
                    <div className="h-[300px] w-full">
                        <AreaChart data={data.revenue_monthly} xKey="month" dataKey="revenue" color="#10B981" height={300} />
                    </div>
                </div>

                {/* Client Revenue */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Client Distribution</h3>
                            <p className="text-sm text-gray-500">Top revenue generating clients</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <BarChart data={data.client_revenue} xKey="client" dataKey="revenue" color="#6366f1" height={300} />
                    </div>
                </div>
            </div>

            {/* Department Performance */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Department Performance</h3>
                        <p className="text-sm text-gray-500">Budget utilization and efficiency analysis</p>
                    </div>
                </div>
                <div className="table-container border-0">
                    <table className="table w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th>Department</th>
                                <th>Team Size</th>
                                <th>Budget</th>
                                <th>Spent</th>
                                <th>Utilization</th>
                                <th>Revenue</th>
                                <th>ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.department_performance.map((dept, index) => {
                                const utilization = Math.round((dept.spent / (dept.budget || 1)) * 100) || 0
                                const roi = Math.round((dept.revenue / (dept.spent || 1)) * 100) || 0
                                return (
                                    <tr key={index}>
                                        <td className="font-medium text-gray-900">{dept.name}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-400" />
                                                <span>{dept.employees}</span>
                                            </div>
                                        </td>
                                        <td>{formatCurrency(dept.budget)}</td>
                                        <td>{formatCurrency(dept.spent)}</td>
                                        <td>
                                            <div className="w-full max-w-[120px]">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium text-gray-700">{utilization}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-yellow-500' : 'bg-primary-500'}`}
                                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-medium text-success">{formatCurrency(dept.revenue)}</td>
                                        <td>
                                            <span className={`badge ${roi >= 200 ? 'badge-success' : roi >= 100 ? 'badge-warning' : 'badge-danger'}`}>
                                                {roi}%
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
