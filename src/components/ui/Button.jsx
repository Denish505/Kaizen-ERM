import { Loader2 } from 'lucide-react'

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
    }

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'px-6 py-3 text-base',
    }

    return (
        <button
            className={`btn ${variants[variant]} ${sizes[size]} ${loading ? 'btn-loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 size={16} className="btn-spinner" />
            ) : Icon ? (
                <Icon size={16} />
            ) : null}
            {children}
        </button>
    )
}
