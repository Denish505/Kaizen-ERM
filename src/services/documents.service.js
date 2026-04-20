import api from './api';

export const documentsService = {
    // Documents
    getDocuments: (params) => api.get('/documents/documents/', { params }),
    getDocument: (id) => api.get(`/documents/documents/${id}/`),
    createDocument: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/documents/documents/', formData, {
            headers: {
                // Do NOT set Content-Type manually for multipart/form-data.
                // Let the browser set it automatically so it includes the correct
                // boundary string — without it Django cannot parse the request body.
                'Content-Type': undefined,
            },
        });
    },
    updateDocument: (id, data) => api.patch(`/documents/documents/${id}/`, data),
    deleteDocument: (id) => api.delete(`/documents/documents/${id}/`),
    shareDocument: (id, data) => api.post(`/documents/documents/${id}/share/`, data),

    // Folders
    getFolders: (params) => api.get('/documents/folders/', { params }),
    createFolder: (data) => api.post('/documents/folders/', data),
    updateFolder: (id, data) => api.patch(`/documents/folders/${id}/`, data),
    deleteFolder: (id) => api.delete(`/documents/folders/${id}/`),

    // Templates
    getTemplates: () => api.get('/documents/templates/'),
    createTemplate: (data) => api.post('/documents/templates/', data),

    // Permissions
    getPermissions: (params) => api.get('/documents/permissions/', { params }),
};
