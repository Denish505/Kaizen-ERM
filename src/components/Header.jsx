import { useState, useRef, useEffect } from 'react'
import { Search, Bell, LogOut, Settings, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../App'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { notificationsService } from '../services/notifications.service'
import { addNotification, markNotificationRead, clearNotifications } from '../store/slices/uiSlice'
import { toast } from 'react-hot-toast'

export default function Header() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const dropdownRef = useRef(null)
    const notifRef = useRef(null)

    // In a real app, we would fetch from backend. Here using local state derived from service in useEffect
    const [notifications, setNotifications] = useState([])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (user) fetchNotifications()
    }, [user])

    const fetchNotifications = async () => {
        try {
            const res = await notificationsService.getNotifications()
            setNotifications(res.data)
        } catch (err) {
            console.error("Failed to fetch notifications")
        }
    }

    const handleMarkRead = async (id) => {
        try {
            await notificationsService.markRead(id)
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (err) {
            console.error("Failed to mark read")
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllRead()
            setNotifications(notifications.map(n => ({ ...n, is_read: true })))
            toast.success("All notifications marked as read")
        } catch (err) {
            console.error("Failed to mark all read")
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
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
            ceo: 'CEO',
            stakeholder: 'Stakeholder',
            hr: 'HR Manager',
            project_manager: 'Project Manager',
            employee: 'Employee'
        }
        return labels[role] || 'Employee'
    }

    // Get user display name - handle different field names
    const getUserName = () => {
        if (user?.full_name) return user.full_name
        if (user?.name) return user.name
        if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`
        if (user?.first_name) return user.first_name
        return 'User'
    }

    // Get avatar URL - handle both absolute URLs and relative paths
    const getAvatarUrl = () => {
        if (user?.avatar_image) {
            if (user.avatar_image.startsWith('http')) {
                return user.avatar_image
            }
            return `http://localhost:8000${user.avatar_image}`
        }
        return null
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-search">
                    <Search size={18} className="text-gray-400" />
                    <input type="text" placeholder="Search..." />
                </div>
            </div>

            <div className="header-right relative">
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button
                        className="header-icon-btn relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-sm text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleMarkRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                <div>
                                                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="header-user cursor-pointer select-none"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="hidden md:block text-right mr-3">
                            <div className="text-sm font-semibold text-gray-800">{getUserName()}</div>
                            <div className="text-xs font-medium" style={{ color: getRoleColor(user?.role) }}>
                                {getRoleLabel(user?.role)}
                            </div>
                        </div>
                        {getAvatarUrl() ? (
                            <img
                                src={getAvatarUrl()}
                                alt="Profile"
                                className="header-avatar-img"
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${getRoleColor(user?.role)}, ${getRoleColor(user?.role)}cc)` }}
                            >
                                {user?.avatar || getUserName().charAt(0).toUpperCase()}
                            </div>
                        )}
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                        />
                    </div>

                    {showDropdown && (
                        <div className="user-dropdown">
                            {/* User Info Header */}
                            <div className="user-dropdown-header">
                                {getAvatarUrl() ? (
                                    <img
                                        src={getAvatarUrl()}
                                        alt="Profile"
                                        className="user-dropdown-avatar-img"
                                    />
                                ) : (
                                    <div className="user-dropdown-avatar" style={{ background: `linear-gradient(135deg, ${getRoleColor(user?.role)}, ${getRoleColor(user?.role)}cc)` }}>
                                        {user?.avatar || getUserName().charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="user-dropdown-info">
                                    <p className="user-dropdown-name">{getUserName()}</p>
                                    <p className="user-dropdown-email">{user?.email}</p>
                                    <span className="user-dropdown-role" style={{ background: `${getRoleColor(user?.role)}20`, color: getRoleColor(user?.role) }}>
                                        {getRoleLabel(user?.role)}
                                    </span>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="user-dropdown-menu">
                                <button
                                    onClick={() => { setShowDropdown(false); navigate('/settings') }}
                                    className="user-dropdown-item"
                                >
                                    <div className="user-dropdown-item-icon">
                                        <Settings size={18} />
                                    </div>
                                    <div className="user-dropdown-item-content">
                                        <span className="user-dropdown-item-label">Settings</span>
                                        <span className="user-dropdown-item-desc">Manage your account</span>
                                    </div>
                                </button>

                                <div className="user-dropdown-divider"></div>

                                <button
                                    onClick={handleLogout}
                                    className="user-dropdown-item user-dropdown-item-danger"
                                >
                                    <div className="user-dropdown-item-icon user-dropdown-icon-danger">
                                        <LogOut size={18} />
                                    </div>
                                    <div className="user-dropdown-item-content">
                                        <span className="user-dropdown-item-label">Sign Out</span>
                                        <span className="user-dropdown-item-desc">End your session</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
