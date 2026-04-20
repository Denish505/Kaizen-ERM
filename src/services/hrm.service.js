import api from './api';

export const hrmService = {
    // Employees
    getEmployees: () => api.get('/hrm/employees/'),
    getEmployee: (id) => api.get(`/hrm/employees/${id}/`),
    createEmployee: (data) => api.post('/hrm/employees/', data),
    updateEmployee: (id, data) => api.patch(`/hrm/employees/${id}/`, data),
    deleteEmployee: (id) => api.delete(`/hrm/employees/${id}/`),
    getMyProfile: () => api.get('/hrm/employees/my_profile/'),

    // Departments
    getDepartments: () => api.get('/departments/'),
    createDepartment: (data) => api.post('/departments/', data),
    updateDepartment: (id, data) => api.patch(`/departments/${id}/`, data),
    deleteDepartment: (id) => api.delete(`/departments/${id}/`),

    // Designations
    getDesignations: () => api.get('/designations/'),

    // Attendance
    getAttendance: () => api.get('/hrm/attendance/'),
    getMyAttendance: () => api.get('/hrm/attendance/my_attendance/'),
    checkIn: () => api.post('/hrm/attendance/check_in/'),
    checkOut: () => api.post('/hrm/attendance/check_out/'),

    // Leaves
    getLeaves: () => api.get('/hrm/leave-requests/'),
    applyLeave: (data) => api.post('/hrm/leave-requests/', data),
    approveLeave: (id) => api.post(`/hrm/leave-requests/${id}/approve/`),
    rejectLeave: (id, reason) => api.post(`/hrm/leave-requests/${id}/reject/`, { reason }),
    getLeaveTypes: () => api.get('/hrm/leave-types/'),

    // Salaries
    getSalaries: (params) => api.get('/hrm/salaries/', { params }),
    getSalary: (id) => api.get(`/hrm/salaries/${id}/`),
    getMySalaries: () => api.get('/hrm/salaries/my_salary/'),
    getMySalary: () => api.get('/hrm/salaries/my_salary/'),  // alias used by MySalary.jsx
    processSalary: (data) => api.post('/hrm/salaries/', data),

    // Holidays
    getHolidays: () => api.get('/hrm/holidays/'),
    createHoliday: (data) => api.post('/hrm/holidays/', data),
    deleteHoliday: (id) => api.delete(`/hrm/holidays/${id}/`),

    // Performance Reviews
    getPerformanceReviews: (params) => api.get('/hrm/performance-reviews/', { params }),
    getEmployeeReviews: (employeeId) => api.get('/hrm/performance-reviews/', { params: { employee: employeeId } }),
    createPerformanceReview: (data) => api.post('/hrm/performance-reviews/', data),
};
