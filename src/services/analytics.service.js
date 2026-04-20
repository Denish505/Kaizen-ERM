import api from './api';

// Mock data to simulate backend response
const mockAnalyticsData = {
    revenue_monthly: [
        { month: 'Aug', revenue: 3500000 },
        { month: 'Sep', revenue: 4200000 },
        { month: 'Oct', revenue: 3800000 },
        { month: 'Nov', revenue: 4800000 },
        { month: 'Dec', revenue: 5200000 },
        { month: 'Jan', revenue: 4500000 },
    ],
    department_performance: [
        { name: 'Engineering', employees: 45, budget: 20000000, spent: 18500000, revenue: 35000000 },
        { name: 'Design', employees: 12, budget: 3500000, spent: 3200000, revenue: 8000000 },
        { name: 'PM', employees: 8, budget: 4500000, spent: 4100000, revenue: 12000000 },
        { name: 'Sales', employees: 15, budget: 6000000, spent: 5500000, revenue: 18000000 },
        { name: 'Marketing', employees: 10, budget: 4000000, spent: 3800000, revenue: 5000000 },
    ],
    client_revenue: [
        { client: 'Tata Motors', revenue: 12000000, projects: 2 },
        { client: 'Reliance', revenue: 15000000, projects: 3 },
        { client: 'HDFC', revenue: 8500000, projects: 2 },
        { client: 'Wipro', revenue: 9500000, projects: 1 },
        { client: 'ICICI', revenue: 7200000, projects: 1 },
    ],
    kpis: [
        { title: 'Annual Revenue', value: '₹5.4Cr', change: '+23%', trend: 'up' },
        { title: 'Net Profit Margin', value: '18.5%', change: '+2.3%', trend: 'up' },
        { title: 'Employee Count', value: '156', change: '+12', trend: 'up' },
        { title: 'Active Projects', value: '24', change: '+5', trend: 'up' },
        { title: 'Client Retention', value: '94%', change: '+3%', trend: 'up' },
        { title: 'Avg Project Value', value: '₹58L', change: '+15%', trend: 'up' },
    ]
}

export const analyticsService = {
    getAnalyticsData: async (year) => {
        const params = year ? { year } : {}
        return api.get('/reports/analytics/overview/', { params });
    }
};
