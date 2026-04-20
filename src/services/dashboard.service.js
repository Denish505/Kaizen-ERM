import api from './api';

export const dashboardService = {
    getDashboardData() {
        return api.get('/reports/dashboard/overview/');
    }
};
