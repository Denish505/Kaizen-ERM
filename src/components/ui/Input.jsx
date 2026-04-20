import { useState } from 'react'
import { Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react'

export default function Input({
    label,
    type = 'text',
    error,
    success,
    className = '',
    icon: Icon,
    clearable = false,
    value,
    onChange,
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const getStateClass = () => {
        if (error) return 'error'
        if (success) return 'success'
        return ''
    }

    const handleClear = () => {
        onChange?.({ target: { value: '' } })
    }

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <div className="relative">
                {Icon && (
                    <Icon
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                )}
                <input
                    type={inputType}
                    className={`form-input ${getStateClass()} ${Icon ? 'pl-10' : ''} ${className}`}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {clearable && value && (
                        <button type="button" onClick={handleClear} className="text-gray-400 hover:text-white">
                            <X size={16} />
                        </button>
                    )}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                    {success && <Check size={18} className="text-green-500" />}
                    {error && <AlertCircle size={18} className="text-red-500" />}
                </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    )
}
