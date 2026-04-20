import api from './api';

export const notificationsService = {
    getNotifications: () => api.get('/notifications/notifications/'),
    markRead: (id) => api.post(`/notifications/notifications/${id}/mark_read/`),
    markAllRead: () => api.post('/notifications/notifications/mark_all_read/'),
};
