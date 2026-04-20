import api from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/token/', { email, password });
        if (response.data.access) {
            localStorage.setItem('kaizen_access_token', response.data.access);
            localStorage.setItem('kaizen_refresh_token', response.data.refresh);
        }
        return response.data;
    },

    async logout() {
        localStorage.removeItem('kaizen_access_token');
        localStorage.removeItem('kaizen_refresh_token');
    },

    getCurrentUser() {
        return api.get('/users/me/');
    }
};
