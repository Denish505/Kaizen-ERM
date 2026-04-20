import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../App'
import { useTheme } from '../context/ThemeContext'
import {
    User, Bell, Shield, Palette, Save, Camera, Lock, Mail, Phone, MapPin,
    Globe, Moon, Sun, Monitor, ChevronRight, Sparkles, Eye, EyeOff, Upload, X
} from 'lucide-react'
import api, { usersAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { indianStatesCities } from '../data/indian_cities'

export default function Settings() {
    const { user, login } = useAuth()
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('profile')
    const [isLoading, setIsLoading] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const fileInputRef = useRef(null)

    // Profile State
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        city: '',
        state: '',
    })

    // Password State
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    })

    // Preferences State
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        leaveUpdates: true,
        projectAlerts: false
    })

    useEffect(() => {
        if (user) {
            setProfile({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                city: user.city || 'Mumbai',
                state: user.state || 'Maharashtra',
            })
        }
    }, [user])

    const handleProfileSave = async () => {
        setIsLoading(true)
        try {
            const res = await usersAPI.update(user.id, profile)
            const updatedUser = { ...user, ...res.data }
            login(updatedUser)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error(error)
            toast.error('Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("New passwords don't match")
            return
        }
        if (passwordData.new_password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            const response = await api.post('/users/change_password/', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            })
            console.log('Password change response:', response.data)
            toast.success('Password changed successfully')
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
        } catch (error) {
            console.error('Password change error:', error)
            console.error('Error response:', error.response)

            // Handle different error types
            if (error.response?.data) {
                const errorData = error.response.data

                // Check for old_password error
                if (errorData.old_password) {
                    const errorMsg = Array.isArray(errorData.old_password)
                        ? errorData.old_password[0]
                        : errorData.old_password
                    toast.error(errorMsg)
                }
                // Check for new_password error
                else if (errorData.new_password) {
                    const errorMsg = Array.isArray(errorData.new_password)
                        ? errorData.new_password[0]
                        : errorData.new_password
                    toast.error(errorMsg)
                }
                // Generic error message
                else if (errorData.detail) {
                    toast.error(errorData.detail)
                }
                // Fallback
                else {
                    toast.error('Failed to change password. Please check your current password.')
                }
            } else if (error.message) {
                toast.error(`Error: ${error.message}`)
            } else {
                toast.error('Failed to change password. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarChange = (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP')
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setAvatarPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleAvatarUpload = async () => {
        const file = fileInputRef.current?.files[0]
        if (!file) {
            toast.error('Please select an image first')
            return
        }

        setIsUploadingAvatar(true)
        try {
            const formData = new FormData()
            formData.append('avatar', file)

            const res = await api.post('/users/upload-avatar/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const updatedUser = { ...user, avatar_image: res.data.avatar_image }
            login(updatedUser)
            setAvatarPreview(null)
            fileInputRef.current.value = ''
            toast.success('Profile photo updated successfully!')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.error || 'Failed to upload photo')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const cancelAvatarUpload = () => {
        setAvatarPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const getRoleColor = (role) => {
        const colors = {
            ceo: '#8b5cf6', stakeholder: '#3b82f6', hr: '#10b981',
            project_manager: '#f59e0b', employee: '#6366f1'
        }
        return colors[role] || '#6366f1'
    }

    const getRoleLabel = (role) => {
        const labels = {
            ceo: 'CEO', stakeholder: 'Stakeholder', hr: 'HR Manager',
            project_manager: 'Project Manager', employee: 'Employee'
        }
        return labels[role] || 'Employee'
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User, desc: 'Your personal information' },
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Communication preferences' },
        { id: 'security', label: 'Security', icon: Shield, desc: 'Password & authentication' },
        { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & display' },
    ]

    const getUserName = () => {
        if (user?.full_name) return user.full_name
        if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`
        return user?.first_name || 'User'
    }

    const getAvatarUrl = () => {
        if (user?.avatar_image) {
            // Handle both absolute URLs and relative paths
            if (user.avatar_image.startsWith('http')) {
                return user.avatar_image
            }
            return `http://localhost:8000${user.avatar_image}`
        }
        return null
    }

    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="settings-header">
                <div className="settings-header-content">
                    <h1 className="settings-title">
                        <Sparkles className="settings-title-icon" />
                        Settings
                    </h1>
                    <p className="settings-subtitle">Manage your account preferences and security</p>
                </div>
            </div>

            <div className="settings-container">
                {/* Profile Card */}
                <div className="settings-profile-card">
                    <div className="settings-profile-bg"></div>
                    <div className="settings-profile-content">
                        {getAvatarUrl() ? (
                            <img
                                src={getAvatarUrl()}
                                alt="Profile"
                                className="settings-avatar settings-avatar-image"
                            />
                        ) : (
                            <div className="settings-avatar" style={{ background: `linear-gradient(135deg, ${getRoleColor(user?.role)}, ${getRoleColor(user?.role)}cc)` }}>
                                {user?.avatar || getUserName().charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h3 className="settings-profile-name">{getUserName()}</h3>
                        <p className="settings-profile-email">{user?.email}</p>
                        <span className="settings-profile-role" style={{ background: `${getRoleColor(user?.role)}20`, color: getRoleColor(user?.role) }}>
                            {getRoleLabel(user?.role)}
                        </span>
                    </div>

                    {/* Tab Navigation */}
                    <div className="settings-nav">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <div className="settings-nav-icon">
                                    <tab.icon size={18} />
                                </div>
                                <div className="settings-nav-text">
                                    <span className="settings-nav-label">{tab.label}</span>
                                    <span className="settings-nav-desc">{tab.desc}</span>
                                </div>
                                <ChevronRight size={16} className="settings-nav-arrow" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Panel */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="settings-panel-icon">
                                    <User size={22} />
                                </div>
                                <div>
                                    <h2 className="settings-panel-title">Profile Information</h2>
                                    <p className="settings-panel-subtitle">Update your personal details</p>
                                </div>
                            </div>

                            {/* Avatar Section */}
                            <div className="settings-section">
                                <div className="settings-avatar-edit">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar Preview"
                                            className="settings-avatar-large settings-avatar-image"
                                        />
                                    ) : getAvatarUrl() ? (
                                        <img
                                            src={getAvatarUrl()}
                                            alt="Profile"
                                            className="settings-avatar-large settings-avatar-image"
                                        />
                                    ) : (
                                        <div className="settings-avatar-large" style={{ background: `linear-gradient(135deg, ${getRoleColor(user?.role)}, ${getRoleColor(user?.role)}cc)` }}>
                                            {user?.avatar || getUserName().charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="settings-avatar-info">
                                        <h4>Profile Photo</h4>
                                        <p>JPG, PNG, GIF or WebP. Max 5MB</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            accept="image/jpeg,image/png,image/gif,image/webp"
                                            style={{ display: 'none' }}
                                        />
                                        {avatarPreview ? (
                                            <div className="settings-avatar-actions">
                                                <button
                                                    className="settings-btn-upload settings-btn-success"
                                                    onClick={handleAvatarUpload}
                                                    disabled={isUploadingAvatar}
                                                >
                                                    <Upload size={16} />
                                                    {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                                                </button>
                                                <button
                                                    className="settings-btn-upload settings-btn-cancel"
                                                    onClick={cancelAvatarUpload}
                                                    disabled={isUploadingAvatar}
                                                >
                                                    <X size={16} />
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="settings-btn-upload"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Camera size={16} />
                                                Change Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="settings-form-grid">
                                <div className="settings-input-group">
                                    <label>First Name</label>
                                    <div className="settings-input-wrapper">
                                        <User size={18} className="settings-input-icon" />
                                        <input
                                            type="text"
                                            value={profile.first_name}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <label>Last Name</label>
                                    <div className="settings-input-wrapper">
                                        <User size={18} className="settings-input-icon" />
                                        <input
                                            type="text"
                                            value={profile.last_name}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <label>Email Address</label>
                                    <div className="settings-input-wrapper disabled">
                                        <Mail size={18} className="settings-input-icon" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                        />
                                    </div>
                                    <span className="settings-input-hint">Email cannot be changed</span>
                                </div>

                                <div className="settings-input-group">
                                    <label>Phone Number</label>
                                    <div className="settings-input-wrapper">
                                        <Phone size={18} className="settings-input-icon" />
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+91-XXXXXXXXXX"
                                        />
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <label>State</label>
                                    <div className="settings-input-wrapper">
                                        <MapPin size={18} className="settings-input-icon" />
                                        <select
                                            value={profile.state}
                                            onChange={(e) => setProfile({ ...profile, state: e.target.value, city: '' })}
                                        >
                                            <option value="">Select State</option>
                                            {Object.keys(indianStatesCities).sort().map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <label>City</label>
                                    <div className="settings-input-wrapper">
                                        <MapPin size={18} className="settings-input-icon" />
                                        <select
                                            value={profile.city}
                                            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                            disabled={!profile.state}
                                            style={{ opacity: !profile.state ? 0.5 : 1, cursor: !profile.state ? 'not-allowed' : 'default' }}
                                        >
                                            <option value="">Select City</option>
                                            {(profile.state ? indianStatesCities[profile.state] || [] : []).sort().map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <button className="settings-btn-secondary">Cancel</button>
                                <button
                                    className="settings-btn-primary"
                                    onClick={handleProfileSave}
                                    disabled={isLoading}
                                >
                                    <Save size={18} />
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="settings-panel-icon security">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <h2 className="settings-panel-title">Security Settings</h2>
                                    <p className="settings-panel-subtitle">Manage your password and authentication</p>
                                </div>
                            </div>

                            {/* Change Password Section */}
                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <Lock size={18} />
                                    Change Password
                                </h3>
                                <p className="settings-section-desc">
                                    Ensure your account is using a strong password for security.
                                </p>

                                <div className="settings-form-single">
                                    <div className="settings-input-group">
                                        <label>Current Password</label>
                                        <div className="settings-input-wrapper">
                                            <Lock size={18} className="settings-input-icon" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.old_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                className="settings-password-toggle"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="settings-input-group">
                                        <label>New Password</label>
                                        <div className="settings-input-wrapper">
                                            <Lock size={18} className="settings-input-icon" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                className="settings-password-toggle"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="settings-input-group">
                                        <label>Confirm New Password</label>
                                        <div className="settings-input-wrapper">
                                            <Lock size={18} className="settings-input-icon" />
                                            <input
                                                type="password"
                                                value={passwordData.confirm_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        className="settings-btn-primary"
                                        onClick={handleChangePassword}
                                        disabled={isLoading || !passwordData.old_password || !passwordData.new_password}
                                    >
                                        <Shield size={18} />
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* 2FA Section */}
                            <div className="settings-section">
                                <div className="settings-2fa-card">
                                    <div className="settings-2fa-icon">
                                        <Shield size={24} />
                                    </div>
                                    <div className="settings-2fa-content">
                                        <h4>Two-Factor Authentication</h4>
                                        <p>Add an extra layer of security to your account by enabling 2FA.</p>
                                    </div>
                                    <button className="settings-btn-outline">Enable 2FA</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="settings-panel-icon notifications">
                                    <Bell size={22} />
                                </div>
                                <div>
                                    <h2 className="settings-panel-title">Notification Preferences</h2>
                                    <p className="settings-panel-subtitle">Control how you receive notifications</p>
                                </div>
                            </div>

                            <div className="settings-section">
                                <div className="settings-toggle-list">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive emails for task assignments and updates' },
                                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get notified about mentions and messages' },
                                        { key: 'taskReminders', label: 'Task Reminders', desc: 'Reminder for upcoming task deadlines' },
                                        { key: 'leaveUpdates', label: 'Leave Updates', desc: 'Notifications for leave request status changes' },
                                        { key: 'projectAlerts', label: 'Project Alerts', desc: 'Critical project milestone and deadline alerts' },
                                    ].map((item) => (
                                        <div key={item.key} className="settings-toggle-item">
                                            <div className="settings-toggle-info">
                                                <span className="settings-toggle-label">{item.label}</span>
                                                <span className="settings-toggle-desc">{item.desc}</span>
                                            </div>
                                            <label className="settings-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences[item.key]}
                                                    onChange={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key] })}
                                                />
                                                <span className="settings-switch-slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="settings-panel-icon appearance">
                                    <Palette size={22} />
                                </div>
                                <div>
                                    <h2 className="settings-panel-title">Appearance</h2>
                                    <p className="settings-panel-subtitle">Customize the look and feel</p>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <Moon size={18} />
                                    Theme
                                </h3>
                                <p className="settings-section-desc">
                                    Select your preferred color theme.
                                </p>

                                <div className="settings-theme-grid">
                                    <button
                                        className={`settings-theme-option ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => setTheme('light')}
                                    >
                                        <div className="settings-theme-preview light">
                                            <Sun size={24} />
                                        </div>
                                        <span>Light</span>
                                    </button>
                                    <button
                                        className={`settings-theme-option ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <div className="settings-theme-preview dark">
                                            <Moon size={24} />
                                        </div>
                                        <span>Dark</span>
                                    </button>
                                    <button
                                        className={`settings-theme-option ${theme === 'system' ? 'active' : ''}`}
                                        onClick={() => setTheme('system')}
                                    >
                                        <div className="settings-theme-preview system">
                                            <Monitor size={24} />
                                        </div>
                                        <span>System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <Globe size={18} />
                                    Language & Region
                                </h3>

                                <div className="settings-form-grid">
                                    <div className="settings-input-group">
                                        <label>Language</label>
                                        <div className="settings-input-wrapper">
                                            <Globe size={18} className="settings-input-icon" />
                                            <select>
                                                <option value="en-IN">English (India)</option>
                                                <option value="hi">Hindi</option>
                                                <option value="en-US">English (US)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="settings-input-group">
                                        <label>Timezone</label>
                                        <div className="settings-input-wrapper">
                                            <Globe size={18} className="settings-input-icon" />
                                            <select>
                                                <option value="IST">IST (India Standard Time)</option>
                                                <option value="UTC">UTC</option>
                                                <option value="EST">EST (Eastern Time)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
