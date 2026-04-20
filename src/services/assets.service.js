import api from './api';

export const assetsService = {
    // Assets
    getAssets: (params) => api.get('/assets/assets/', { params }),
    getAsset: (id) => api.get(`/assets/assets/${id}/`),
    createAsset: (data) => api.post('/assets/assets/', data),
    updateAsset: (id, data) => api.patch(`/assets/assets/${id}/`, data),
    deleteAsset: (id) => api.delete(`/assets/assets/${id}/`),
    assignAsset: (id, userId) => api.post(`/assets/assets/${id}/assign/`, { user_id: userId }),

    // Categories
    getCategories: () => api.get('/assets/categories/'),
    createCategory: (data) => api.post('/assets/categories/', data),
    updateCategory: (id, data) => api.patch(`/assets/categories/${id}/`, data),
    deleteCategory: (id) => api.delete(`/assets/categories/${id}/`),

    // Maintenance
    getMaintenanceRecords: () => api.get('/assets/maintenance/'),
    createMaintenanceRecord: (data) => api.post('/assets/maintenance/', data),
    updateMaintenanceRecord: (id, data) => api.patch(`/assets/maintenance/${id}/`, data),
    deleteMaintenanceRecord: (id) => api.delete(`/assets/maintenance/${id}/`),

    // Software Licenses
    getSoftwareLicenses: (params) => api.get('/assets/licenses/', { params }),
    getSoftwareLicense: (id) => api.get(`/assets/licenses/${id}/`),
    createSoftwareLicense: (data) => api.post('/assets/licenses/', data),
    updateSoftwareLicense: (id, data) => api.patch(`/assets/licenses/${id}/`, data),
    deleteSoftwareLicense: (id) => api.delete(`/assets/licenses/${id}/`),

    // License Assignments
    getLicenseAssignments: (params) => api.get('/assets/license-assignments/', { params }),
    assignLicense: (data) => api.post('/assets/license-assignments/', data),
    returnLicense: (id) => api.post(`/assets/license-assignments/${id}/return_license/`),
};
