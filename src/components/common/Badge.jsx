import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function Badge({
    children,
    variant = 'default', // default, primary, success, warning, danger, info
    className,
    size = 'md' // sm, md
}) {
    const baseStyles = 'inline-flex items-center font-medium rounded-full border'

    const variants = {
        default: 'bg-gray-100 text-gray-700 border-gray-200',
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200'
    }

    const sizes = {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm'
    }

    return (
        <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}>
            {children}
        </span>
    )
}
