import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { setUser as setReduxUser } from './store/slices/authSlice'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import Login from './pages/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Employees from './pages/hrm/Employees'
import Departments from './pages/hrm/Departments'
import Attendance from './pages/hrm/Attendance'
import LeaveRequests from './pages/hrm/LeaveRequests'
import Payroll from './pages/hrm/Payroll'
import Holidays from './pages/hrm/Holidays'
import PerformanceReviews from './pages/hrm/PerformanceReviews'
import Projects from './pages/projects/Projects'
import Tasks from './pages/projects/Tasks'
import Timesheets from './pages/projects/Timesheets'
import Clients from './pages/clients/Clients'
import Leads from './pages/clients/Leads'
import Salaries from './pages/finance/Salaries'
import Invoices from './pages/finance/Invoices'
import Expenses from './pages/finance/Expenses'
import MyFinance from './pages/finance/MyFinance'
import Assets from './pages/assets/Assets'
import Documents from './pages/documents/Documents'
import Reports from './pages/reports/Reports'
import MyCalendar from './pages/employee/MyCalendar'
import MyAttendance from './pages/employee/MyAttendance'
import MySalary from './pages/employee/MySalary'
import MyTasks from './pages/employee/MyTasks'
import MyPerformance from './pages/employee/MyPerformance'

// Auth Context
export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

function App() {
  const dispatch = useDispatch()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaizen_user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user))
    }
  }, [user, dispatch])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('kaizen_user', JSON.stringify(userData))
    dispatch(setReduxUser(userData))
  }

  const logout = () => {
    import('./services/auth.service').then(({ authService }) => {
      authService.logout()
    })
    setUser(null)
    localStorage.removeItem('kaizen_user')
    dispatch(setReduxUser(null))
  }

  const location = useLocation()

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Toaster position="top-right" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

          <Route element={user ? <MainLayout /> : <Navigate to="/" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />

            {/* HRM Routes */}
            <Route path="/hrm/employees" element={<Employees />} />
            <Route path="/hrm/departments" element={<Departments />} />
            <Route path="/hrm/attendance" element={<Attendance />} />
            <Route path="/hrm/leave-requests" element={<LeaveRequests />} />
            <Route path="/hrm/payroll" element={<Payroll />} />
            <Route path="/hrm/holidays" element={<Holidays />} />
            <Route path="/hrm/performance-reviews" element={<PerformanceReviews />} />

            {/* Project Routes */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/tasks" element={<Tasks />} />
            <Route path="/projects/timesheets" element={<Timesheets />} />

            {/* Client Routes */}
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/leads" element={<Leads />} />

            {/* Finance Routes */}
            <Route path="/finance/salaries" element={<Salaries />} />
            <Route path="/finance/invoices" element={<Invoices />} />
            <Route path="/finance/expenses" element={<Expenses />} />
            <Route path="/finance/my-finance" element={<MyFinance />} />

            {/* Asset Routes */}
            <Route path="/assets" element={<Assets />} />

            {/* Document Routes */}
            <Route path="/documents" element={<Documents />} />

            {/* Reports Routes */}
            <Route path="/reports" element={<Reports />} />

            {/* My Workspace (Employee Self-Service) */}
            <Route path="/my/calendar" element={<MyCalendar />} />
            <Route path="/my/attendance" element={<MyAttendance />} />
            <Route path="/my/salary" element={<MySalary />} />
            <Route path="/my/tasks" element={<MyTasks />} />
            <Route path="/my/performance" element={<MyPerformance />} />
          </Route>
          
          {/* Catch-all route for unknown URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthContext.Provider>
  )
}

export default App
