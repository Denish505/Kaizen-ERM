import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { getNavigationForRole } from '../data/users'
import {
    LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
    FolderKanban, CheckSquare, UserCircle, Target, FileText,
    Receipt, CreditCard, Package, FileArchive, Settings, TrendingUp,
    DollarSign, Wallet
} from 'lucide-react'

// Icon mapping
const iconMap = {
    LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
    FolderKanban, CheckSquare, UserCircle, Target, FileText,
    Receipt, CreditCard, Package, FileArchive, Settings, TrendingUp,
    DollarSign, Wallet
}

export default function Sidebar() {
    const location = useLocation()
    const { user } = useAuth()

    // Get role-based navigation
    const navigation = getNavigationForRole(user?.role)

    const getRoleColor = (role) => {
        const colors = {
            ceo: '#8b5cf6',
            stakeholder: '#3b82f6',
            hr: '#10b981',
            project_manager: '#f59e0b',
            employee: '#6366f1',
            admin: '#ef4444',
            finance_manager: '#06b6d4',
        }
        return colors[role] || '#6366f1'
    }

    const getRoleLabel = (role) => {
        const labels = {
            ceo: 'Chief Executive Officer',
            stakeholder: 'Stakeholder',
            hr: 'HR Manager',
            project_manager: 'Project Manager',
            employee: 'Employee',
            admin: 'Administrator',
            finance_manager: 'Finance Manager',
        }
        return labels[role] || role?.replace('_', ' ') || 'Employee'
    }

    const getDisplayName = () => {
        if (user?.full_name) return user.full_name
        const first = user?.first_name || ''
        const last = user?.last_name || ''
        const combined = `${first} ${last}`.trim()
        return combined || user?.email?.split('@')[0] || 'User'
    }

    const getAvatarUrl = () => {
        if (user?.avatar_image) {
            if (user.avatar_image.startsWith('http')) {
                return user.avatar_image
            }
            return `http://localhost:8000${user.avatar_image}`
        }
        return null
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">K</div>
                    <span className="sidebar-logo-text">Kaizen</span>
                </div>
            </div>

            {/* User Info */}
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getAvatarUrl() ? (
                        <img
                            src={getAvatarUrl()}
                            alt="Profile"
                            className="sidebar-user-avatar"
                        />
                    ) : (
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${getRoleColor(user?.role)}, ${getRoleColor(user?.role)}99)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            color: 'white'
                        }}>
                            {(user?.avatar && user.avatar.length <= 3) ? user.avatar : getDisplayName().charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {getDisplayName()}
                        </p>
                        <p style={{
                            fontSize: '0.7rem',
                            color: getRoleColor(user?.role),
                            fontWeight: '500'
                        }}>
                            {getRoleLabel(user?.role)}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigation.sections.map((section, idx) => (
                    <div key={idx} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => {
                            const IconComponent = iconMap[item.icon] || LayoutDashboard
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`
                                    }
                                    end={item.path === '/'}
                                >
                                    <IconComponent className="nav-item-icon" size={20} />
                                    <span className="nav-item-text">{item.label}</span>
                                </NavLink>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <NavLink to="/settings" className="nav-item">
                    <Settings className="nav-item-icon" size={20} />
                    <span className="nav-item-text">Settings</span>
                </NavLink>
            </div>
        </aside>
    )
}
