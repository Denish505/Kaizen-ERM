import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react'
import Button from './Button'

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false
}) {
    if (!isOpen) return null

    const icons = {
        danger: <Trash2 size={24} />,
        warning: <AlertTriangle size={24} />,
        info: <AlertCircle size={24} />
    }

    const iconColors = {
        danger: 'bg-red-500/10 text-red-500',
        warning: 'bg-amber-500/10 text-amber-500',
        info: 'bg-blue-500/10 text-blue-500'
    }

    return (
        <div className="confirm-overlay" onClick={onClose}>
            <div className={`confirm-dialog ${variant}`} onClick={e => e.stopPropagation()}>
                <div className={`confirm-icon ${iconColors[variant]}`}>
                    {icons[variant]}
                </div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    )
}
