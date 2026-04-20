import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

export default function StatCard({
    label,
    value,
    icon: Icon,
    trend, // { value: number, isUp: boolean }
    color = 'primary', // primary, success, warning, info, danger
    className
}) {
    const colorStyles = {
        primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
        success: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
        info: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' }
    }

    const currentStyle = colorStyles[color] || colorStyles.primary

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={twMerge(clsx("bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow", className))}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                    {trend && (
                        <div className={`flex items-center text-xs mt-2 font-medium ${trend.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            <span>{trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                            <span className="text-gray-400 ml-1 font-normal">vs last month</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl ${currentStyle.bg} ${currentStyle.text}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
        </motion.div>
    )
}
