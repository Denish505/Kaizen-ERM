import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('kaizen_access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired - try to refresh
            const refreshToken = localStorage.getItem('kaizen_refresh_token')
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE}/token/refresh/`, {
                        refresh: refreshToken,
                    })
                    localStorage.setItem('kaizen_access_token', response.data.access)
                    // Retry original request
                    error.config.headers.Authorization = `Bearer ${response.data.access}`
                    return api(error.config)
                } catch (refreshError) {
                    // Refresh failed - logout
                    localStorage.removeItem('kaizen_access_token')
                    localStorage.removeItem('kaizen_refresh_token')
                    localStorage.removeItem('kaizen_user')
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const response = await axios.post(`${API_BASE}/token/`, { email, password })
        const { access, refresh } = response.data
        localStorage.setItem('kaizen_access_token', access)
        localStorage.setItem('kaizen_refresh_token', refresh)

        // Get user details
        const userResponse = await api.get('/users/me/')
        return userResponse.data
    },

    logout: () => {
        localStorage.removeItem('kaizen_access_token')
        localStorage.removeItem('kaizen_refresh_token')
        localStorage.removeItem('kaizen_user')
    },

    getCurrentUser: () => api.get('/users/me/'),
}

// Users API
export const usersAPI = {
    getAll: () => api.get('/users/'),
    getById: (id) => api.get(`/users/${id}/`),
    create: (data) => api.post('/users/', data),
    update: (id, data) => api.patch(`/users/${id}/`, data),
    delete: (id) => api.delete(`/users/${id}/`),
    getByRole: (role) => api.get(`/users/by_role/?role=${role}`),
}

// Departments API
export const departmentsAPI = {
    getAll: () => api.get('/departments/'),
    getById: (id) => api.get(`/departments/${id}/`),
    create: (data) => api.post('/departments/', data),
    update: (id, data) => api.patch(`/departments/${id}/`, data),
    delete: (id) => api.delete(`/departments/${id}/`),
}

// HRM APIs
export const attendanceAPI = {
    getAll: () => api.get('/hrm/attendance/'),
    checkIn: () => api.post('/hrm/attendance/check_in/'),
    checkOut: () => api.post('/hrm/attendance/check_out/'),
}

export const leaveAPI = {
    getAll: () => api.get('/hrm/leave-requests/'),
    create: (data) => api.post('/hrm/leave-requests/', data),
    approve: (id) => api.post(`/hrm/leave-requests/${id}/approve/`),
    reject: (id, reason) => api.post(`/hrm/leave-requests/${id}/reject/`, { reason }),
    getTypes: () => api.get('/hrm/leave-types/'),
}

export const salaryAPI = {
    getAll: () => api.get('/hrm/salaries/'),
    getMySalary: () => api.get('/hrm/salaries/my_salary/'),
}

export const employeesAPI = {
    getAll: () => api.get('/hrm/employees/'),
    getMyProfile: () => api.get('/hrm/employees/my_profile/'),
}

export default api
