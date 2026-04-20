import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Users, Briefcase, Receipt, Building2, Calendar } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

export default function Reports() {
    const [isExporting, setIsExporting] = useState({})

    const handleExport = async (reportType) => {
        setIsExporting({ ...isExporting, [reportType]: true })
        try {
            const response = await api.get(`/reports/${reportType}/export/`, {
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${reportType}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success(`${reportType} report exported successfully`)
        } catch (error) {
            console.error(error)
            toast.error(`Failed to export ${reportType} report`)
        } finally {
            setIsExporting({ ...isExporting, [reportType]: false })
        }
    }

    const reports = [
        {
            id: 'employees',
            title: 'Employees Report',
            description: 'Export all employee data including personal details, department, and designation.',
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            id: 'projects',
            title: 'Projects Report',
            description: 'Export all projects with client info, status, timeline, and budget details.',
            icon: Briefcase,
            color: 'bg-purple-500'
        },
        {
            id: 'invoices',
            title: 'Invoices Report',
            description: 'Export all invoices with client, amounts, dates, and payment status.',
            icon: Receipt,
            color: 'bg-green-500'
        },
    ]

    return (
        <div className="animate-fadeIn">
            <div className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500">Export data to CSV for analysis and reporting</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                            <report.icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                        <button
                            onClick={() => handleExport(report.id)}
                            disabled={isExporting[report.id]}
                            className="w-full btn btn-primary flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            {isExporting[report.id] ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export History</h2>
                <p className="text-sm text-gray-500">Recent exports will appear here. Feature coming soon.</p>
            </div>
        </div>
    )
}
