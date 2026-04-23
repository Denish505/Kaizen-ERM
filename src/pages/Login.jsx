import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, Shield, Zap, Users } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const { authService } = await import('../services/auth.service')
            await authService.login(email, password)
            const userResponse = await authService.getCurrentUser()
            login(userResponse.data)
            navigate('/dashboard')
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.detail || 'Invalid email or password')
        } finally {
            setIsLoading(false)
        }
    }

    const demoCredentials = [
        { role: 'CEO', email: 'ceo@kaizen.com', password: 'password123', icon: Sparkles, gradient: 'linear-gradient(135deg, #a855f7, #6366f1)' },
        { role: 'HR Manager', email: 'hr@kaizen.com', password: 'password123', icon: Users, gradient: 'linear-gradient(135deg, #10b981, #06b6d4)' },
        { role: 'Project Manager', email: 'pm@kaizen.com', password: 'password123', icon: Zap, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
        { role: 'Employee', email: 'employee@kaizen.com', password: 'password123', icon: Shield, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    ]

    const quickLogin = async (cred) => {
        setEmail(cred.email)
        setPassword(cred.password)
        setError('')
        setIsLoading(true)
        try {
            const { authService } = await import('../services/auth.service')
            await authService.login(cred.email, cred.password)
            const userResponse = await authService.getCurrentUser()
            login(userResponse.data)
            navigate('/dashboard')
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.detail || 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="login-orb login-orb-1"></div>
                <div className="login-orb login-orb-2"></div>
                <div className="login-orb login-orb-3"></div>
                <div className="login-grid"></div>
            </div>

            {/* Left Panel - Branding */}
            <div className="login-branding">
                <div className="login-branding-content">
                    <div className="login-brand-logo">
                        <span>K</span>
                    </div>
                    <h1>Kaizen ERM</h1>
                    <p>Enterprise Resource Management</p>

                    <div className="login-features">
                        <div className="login-feature">
                            <div className="login-feature-icon"><Zap size={20} /></div>
                            <div>
                                <h4>Lightning Fast</h4>
                                <p>Real-time data processing</p>
                            </div>
                        </div>
                        <div className="login-feature">
                            <div className="login-feature-icon"><Shield size={20} /></div>
                            <div>
                                <h4>Enterprise Security</h4>
                                <p>Bank-grade encryption</p>
                            </div>
                        </div>
                        <div className="login-feature">
                            <div className="login-feature-icon"><Users size={20} /></div>
                            <div>
                                <h4>Team Collaboration</h4>
                                <p>Seamless workflows</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-form-panel">
                <div className="login-form-container">
                    <div className="login-form-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="login-input-group">
                            <label>Email Address</label>
                            <div className="login-input-wrapper">
                                <Mail size={18} className="login-input-icon" />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-input-group">
                            <label>Password</label>
                            <div className="login-input-wrapper">
                                <Lock size={18} className="login-input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="login-remember">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                        </div>

                        <button type="submit" className="login-submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <div className="login-spinner"></div>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <Sparkles size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>Quick Access Demo</span>
                    </div>

                    <div className="login-demo-grid">
                        {demoCredentials.map((cred, idx) => {
                            const Icon = cred.icon
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className="login-demo-btn"
                                    onClick={() => quickLogin(cred)}
                                    disabled={isLoading}
                                >
                                    <div className="login-demo-icon" style={{ background: cred.gradient }}>
                                        <Icon size={16} />
                                    </div>
                                    <span>{cred.role}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
