import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await api.post('/password_reset/', { email })
            setIsSubmitted(true)
            toast.success('Reset link sent to your email')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.detail || 'Failed to send reset link')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                        <Mail size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="form-label block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    className="form-input w-full pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-3 text-left">
                            <CheckCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Check your email</p>
                                <p className="text-sm mt-1 opacity-90">We've sent a password reset link to <strong>{email}</strong></p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Didn't receive the email? <button onClick={() => setIsSubmitted(false)} className="text-primary-600 hover:underline">Click to resend</button>
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
