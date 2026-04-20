import api from './api';

export const projectsService = {
    // Projects
    getProjects: (params) => api.get('/projects/projects/', { params }),
    getProject: (id) => api.get(`/projects/projects/${id}/`),
    createProject: (data) => api.post('/projects/projects/', data),
    updateProject: (id, data) => api.patch(`/projects/projects/${id}/`, data),
    deleteProject: (id) => api.delete(`/projects/projects/${id}/`),
    getProjectStats: (id) => api.get(`/projects/projects/${id}/stats/`),
    getMyProjects: () => api.get('/projects/projects/my_projects/'),

    // Tasks
    getTasks: (params) => api.get('/projects/tasks/', { params }),
    getTask: (id) => api.get(`/projects/tasks/${id}/`),
    createTask: (data) => api.post('/projects/tasks/', data),
    updateTask: (id, data) => api.patch(`/projects/tasks/${id}/`, data),
    deleteTask: (id) => api.delete(`/projects/tasks/${id}/`),
    updateTaskStatus: (id, status) => api.post(`/projects/tasks/${id}/update_status/`, { status }),
    getMyTasks: () => api.get('/projects/tasks/my_tasks/'),
    assignTask: (data) => api.post('/projects/tasks/assign_task/', data),
    getAllEmployeeTasks: (params) => api.get('/projects/tasks/all_employee_tasks/', { params }),

    // Project Members
    getProjectMembers: (projectId) => api.get('/projects/members/', { params: { project: projectId } }),
    addProjectMember: (data) => api.post('/projects/members/', data),
    removeProjectMember: (id) => api.delete(`/projects/members/${id}/`),

    // Sprints
    getSprints: (projectId) => api.get('/projects/sprints/', { params: { project: projectId } }),
    createSprint: (data) => api.post('/projects/sprints/', data),
    updateSprint: (id, data) => api.patch(`/projects/sprints/${id}/`, data),
    deleteSprint: (id) => api.delete(`/projects/sprints/${id}/`),

    // Milestones
    getMilestones: (projectId) => api.get('/projects/milestones/', { params: { project: projectId } }),
    createMilestone: (data) => api.post('/projects/milestones/', data),
    updateMilestone: (id, data) => api.patch(`/projects/milestones/${id}/`, data),
    deleteMilestone: (id) => api.delete(`/projects/milestones/${id}/`),

    // Timesheets
    getTimesheets: (params) => api.get('/projects/timesheets/', { params }),
    createTimesheet: (data) => api.post('/projects/timesheets/', data),
    updateTimesheet: (id, data) => api.patch(`/projects/timesheets/${id}/`, data),
    deleteTimesheet: (id) => api.delete(`/projects/timesheets/${id}/`),
    getMyTimesheets: () => api.get('/projects/timesheets/my_timesheets/'),

    // Task Comments & Attachments
    getTaskComments: (taskId) => api.get(`/projects/tasks/${taskId}/comments/`),
    addTaskComment: (taskId, data) => api.post(`/projects/tasks/${taskId}/add_comment/`, data),
    getTaskAttachments: (taskId) => api.get(`/projects/tasks/${taskId}/attachments/`),
    uploadTaskAttachment: (taskId, data) => api.post(`/projects/tasks/${taskId}/upload_attachment/`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};
