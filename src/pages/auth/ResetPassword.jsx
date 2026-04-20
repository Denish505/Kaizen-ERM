import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, CheckCircle, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

export default function ResetPassword() {
    const { uid, token } = useParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            await api.post('/password_reset_confirm/', { uid, token, password })
            setIsSuccess(true)
            toast.success('Password reset successfully')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.error || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Create a strong password for your account.
                    </p>
                </div>

                {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="form-label block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="text-green-600 flex flex-col items-center gap-2">
                            <CheckCircle size={48} />
                            <p className="font-medium text-lg">Password Reset Successful!</p>
                        </div>
                        <p className="text-gray-500 text-sm">You can now log in with your new password.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary w-full py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Go to Login <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
