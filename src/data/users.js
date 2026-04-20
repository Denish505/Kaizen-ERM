// Mock User Database with Indian Credentials
// These are used for demo login when backend is not available

export const USERS = [
    // CEO
    {
        id: 1,
        email: 'ceo@kaizen.com',
        password: 'password123',
        name: 'Rajesh Sharma',
        role: 'ceo',
        roleLabel: 'Chief Executive Officer',
        avatar: 'RS',
        department: 'Executive',
        city: 'Mumbai'
    },

    // Stakeholders
    {
        id: 2,
        email: 'stakeholder1@kaizen.com',
        password: 'password123',
        name: 'Vikram Mehta',
        role: 'stakeholder',
        roleLabel: 'Board Member',
        avatar: 'VM',
        department: 'Board',
        city: 'Mumbai'
    },
    {
        id: 3,
        email: 'stakeholder2@kaizen.com',
        password: 'password123',
        name: 'Priya Agarwal',
        role: 'stakeholder',
        roleLabel: 'Investor',
        avatar: 'PA',
        department: 'Board',
        city: 'Delhi'
    },
    {
        id: 4,
        email: 'stakeholder3@kaizen.com',
        password: 'password123',
        name: 'Suresh Iyer',
        role: 'stakeholder',
        roleLabel: 'Advisory Board',
        avatar: 'SI',
        department: 'Board',
        city: 'Chennai'
    },

    // HR Manager
    {
        id: 5,
        email: 'hr@kaizen.com',
        password: 'password123',
        name: 'Anjali Deshmukh',
        role: 'hr',
        roleLabel: 'HR Manager',
        avatar: 'AD',
        department: 'Human Resources',
        city: 'Mumbai'
    },

    // Project Managers
    {
        id: 6,
        email: 'pm1@kaizen.com',
        password: 'password123',
        name: 'Arjun Nair',
        role: 'project_manager',
        roleLabel: 'Senior Project Manager',
        avatar: 'AN',
        department: 'Project Management',
        city: 'Bangalore'
    },
    {
        id: 7,
        email: 'pm2@kaizen.com',
        password: 'password123',
        name: 'Sneha Kulkarni',
        role: 'project_manager',
        roleLabel: 'Project Manager',
        avatar: 'SK',
        department: 'Project Management',
        city: 'Pune'
    },

    // Employees
    {
        id: 8,
        email: 'amit@kaizen.com',
        password: 'password123',
        name: 'Amit Patel',
        role: 'employee',
        roleLabel: 'Senior Developer',
        avatar: 'AP',
        department: 'Engineering',
        city: 'Bangalore'
    },
    {
        id: 9,
        email: 'pooja@kaizen.com',
        password: 'password123',
        name: 'Pooja Singh',
        role: 'employee',
        roleLabel: 'UI/UX Designer',
        avatar: 'PS',
        department: 'Design',
        city: 'Bangalore'
    },
    {
        id: 10,
        email: 'rahul@kaizen.com',
        password: 'password123',
        name: 'Rahul Verma',
        role: 'employee',
        roleLabel: 'Software Developer',
        avatar: 'RV',
        department: 'Engineering',
        city: 'Bangalore'
    },
    {
        id: 11,
        email: 'neha@kaizen.com',
        password: 'password123',
        name: 'Neha Gupta',
        role: 'employee',
        roleLabel: 'Accountant',
        avatar: 'NG',
        department: 'Finance',
        city: 'Mumbai'
    },
    {
        id: 12,
        email: 'kiran@kaizen.com',
        password: 'password123',
        name: 'Kiran Reddy',
        role: 'employee',
        roleLabel: 'Sales Executive',
        avatar: 'KR',
        department: 'Sales',
        city: 'Hyderabad'
    }
]

// Role-based navigation configuration
export const ROLE_NAVIGATION = {
    ceo: {
        sections: [
            {
                title: 'Overview',
                items: [
                    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
                    { path: '/analytics', label: 'Analytics', icon: 'TrendingUp' },
                ]
            },
            {
                title: 'Organisation',
                items: [
                    { path: '/hrm/employees', label: 'Employees', icon: 'Users' },
                    { path: '/hrm/departments', label: 'Departments', icon: 'Building2' },
                ]
            },
            {
                title: 'Business',
                items: [
                    { path: '/projects', label: 'Projects', icon: 'FolderKanban' },
                    { path: '/clients', label: 'Clients', icon: 'UserCircle' },
                    { path: '/clients/leads', label: 'Leads', icon: 'Target' },
                ]
            },
            {
                title: 'Finance',
                items: [
                    { path: '/finance/salaries', label: 'Salaries', icon: 'DollarSign' },
                    { path: '/finance/invoices', label: 'Invoices', icon: 'Receipt' },
                    { path: '/finance/expenses', label: 'Expenses', icon: 'CreditCard' },
                ]
            },
            {
                title: 'Resources',
                items: [
                    { path: '/assets', label: 'Assets', icon: 'Package' },
                    { path: '/documents', label: 'Documents', icon: 'FileArchive' },
                    { path: '/reports', label: 'Reports', icon: 'FileText' },
                ]
            },
            {
                title: 'My Workspace',
                items: [
                    { path: '/my/calendar', label: 'My Calendar', icon: 'CalendarCheck' },
                    { path: '/my/attendance', label: 'My Attendance', icon: 'CalendarCheck' },
                    { path: '/my/tasks', label: 'My Tasks', icon: 'CheckSquare' },
                    { path: '/my/salary', label: 'My Salary', icon: 'Wallet' },
                    { path: '/my/performance', label: 'My Performance', icon: 'TrendingUp' },
                ]
            }
        ]
    }, stakeholder: {
        sections: [
            {
                title: 'Overview',
                items: [
                    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
                    { path: '/analytics', label: 'Analytics', icon: 'TrendingUp' },
                ]
            },
            {
                title: 'Reports',
                items: [
                    { path: '/projects', label: 'Projects', icon: 'FolderKanban' },
                    { path: '/finance/salaries', label: 'Payroll', icon: 'DollarSign' },
                    { path: '/finance/invoices', label: 'Revenue', icon: 'Receipt' },
                ]
            },
            {
                title: 'Resources',
                items: [
                    { path: '/documents', label: 'Reports', icon: 'FileArchive' },
                ]
            },
            {
                title: 'My Workspace',
                items: [
                    { path: '/my/calendar', label: 'My Calendar', icon: 'CalendarCheck' },
                    { path: '/my/attendance', label: 'My Attendance', icon: 'CalendarCheck' },
                    { path: '/my/tasks', label: 'My Tasks', icon: 'CheckSquare' },
                    { path: '/my/salary', label: 'My Salary', icon: 'Wallet' },
                    { path: '/my/performance', label: 'My Performance', icon: 'TrendingUp' },
                ]
            }
        ]
    },

    hr: {
        sections: [
            {
                title: 'Overview',
                items: [
                    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
                ]
            },
            {
                title: 'Human Resources',
                items: [
                    { path: '/hrm/employees', label: 'Employees', icon: 'Users' },
                    { path: '/hrm/departments', label: 'Departments', icon: 'Building2' },
                    { path: '/hrm/attendance', label: 'Attendance', icon: 'CalendarCheck' },
                    { path: '/hrm/leave-requests', label: 'Leave Requests', icon: 'CalendarOff' },
                ]
            },
            {
                title: 'Payroll',
                items: [
                    { path: '/finance/salaries', label: 'Salaries', icon: 'DollarSign' },
                ]
            },
            {
                title: 'Resources',
                items: [
                    { path: '/documents', label: 'Documents', icon: 'FileArchive' },
                ]
            },
            {
                title: 'My Workspace',
                items: [
                    { path: '/my/calendar', label: 'My Calendar', icon: 'CalendarCheck' },
                    { path: '/my/attendance', label: 'My Attendance', icon: 'CalendarCheck' },
                    { path: '/my/tasks', label: 'My Tasks', icon: 'CheckSquare' },
                    { path: '/my/salary', label: 'My Salary', icon: 'Wallet' },
                    { path: '/my/performance', label: 'My Performance', icon: 'TrendingUp' },
                ]
            }
        ]
    },

    project_manager: {
        sections: [
            {
                title: 'Overview',
                items: [
                    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
                ]
            },
            {
                title: 'Project Management',
                items: [
                    { path: '/projects', label: 'Projects', icon: 'FolderKanban' },
                    { path: '/projects/tasks', label: 'Tasks', icon: 'CheckSquare' },
                ]
            },
            {
                title: 'Team',
                items: [
                    { path: '/hrm/employees', label: 'Team Members', icon: 'Users' },
                    { path: '/hrm/attendance', label: 'Attendance', icon: 'CalendarCheck' },
                    { path: '/hrm/leave-requests', label: 'Leave Requests', icon: 'CalendarOff' },
                ]
            },
            {
                title: 'Clients',
                items: [
                    { path: '/clients', label: 'Clients', icon: 'UserCircle' },
                ]
            },
            {
                title: 'My Finance',
                items: [
                    { path: '/finance/my-finance', label: 'My Salary', icon: 'Wallet' },
                ]
            },
            {
                title: 'Resources',
                items: [
                    { path: '/documents', label: 'Documents', icon: 'FileArchive' },
                ]
            },
            {
                title: 'My Workspace',
                items: [
                    { path: '/my/calendar', label: 'My Calendar', icon: 'CalendarCheck' },
                    { path: '/my/attendance', label: 'My Attendance', icon: 'CalendarCheck' },
                    { path: '/my/tasks', label: 'My Tasks', icon: 'CheckSquare' },
                    { path: '/my/salary', label: 'My Salary', icon: 'Wallet' },
                    { path: '/my/performance', label: 'My Performance', icon: 'TrendingUp' },
                ]
            }
        ]
    },

    employee: {
        sections: [
            {
                title: 'My Work',
                items: [
                    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
                    { path: '/my/tasks', label: 'My Tasks', icon: 'CheckSquare' },
                ]
            },
            {
                title: 'Attendance',
                items: [
                    { path: '/hrm/attendance', label: 'My Attendance', icon: 'CalendarCheck' },
                    { path: '/hrm/leave-requests', label: 'Leave Requests', icon: 'CalendarOff' },
                ]
            },
            {
                title: 'My Finance',
                items: [
                    { path: '/finance/my-finance', label: 'My Salary', icon: 'Wallet' },
                ]
            },
            {
                title: 'Resources',
                items: [
                    { path: '/documents', label: 'Documents', icon: 'FileArchive' },
                ]
            }
        ]
    }
}

// Authentication function (fallback for demo mode)
export function authenticateUser(email, password) {
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (user) {
        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
    }
    return null
}

// Get navigation for a role
export function getNavigationForRole(role) {
    return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.employee
}
