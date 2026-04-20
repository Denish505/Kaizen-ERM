import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

export default function Button({
    children,
    variant = 'primary', // primary, secondary, outline, ghost, danger, success
    size = 'md', // sm, md, lg
    className,
    icon: Icon,
    isLoading = false,
    disabled,
    type = 'button',
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200 focus:ring-primary-500',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-200',
        outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-200',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200 focus:ring-red-500',
        success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 focus:ring-emerald-500'
    }

    const sizes = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base'
    }

    return (
        <button
            type={type}
            className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
            {Icon && !isLoading && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
            {children}
        </button>
    )
}
