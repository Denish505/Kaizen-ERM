import api from './api';

export const clientsService = {
    // Clients
    getClients: (params) => api.get('/clients/clients/', { params }),
    getClient: (id) => api.get(`/clients/clients/${id}/`),
    createClient: (data) => api.post('/clients/clients/', data),
    updateClient: (id, data) => api.patch(`/clients/clients/${id}/`, data),
    deleteClient: (id) => api.delete(`/clients/clients/${id}/`),

    // Leads
    getLeads: (params) => api.get('/clients/leads/', { params }),
    getLead: (id) => api.get(`/clients/leads/${id}/`),
    createLead: (data) => api.post('/clients/leads/', data),
    updateLead: (id, data) => api.patch(`/clients/leads/${id}/`, data),
    deleteLead: (id) => api.delete(`/clients/leads/${id}/`),
    convertLead: (id) => api.post(`/clients/leads/${id}/convert/`),
    getMyLeads: () => api.get('/clients/leads/my_leads/'),

    // Contacts
    getContacts: (params) => api.get('/clients/contacts/', { params }),
    addContact: (data) => api.post('/clients/contacts/', data),
    updateContact: (id, data) => api.patch(`/clients/contacts/${id}/`, data),
    deleteContact: (id) => api.delete(`/clients/contacts/${id}/`),
    getClientContacts: (clientId) => api.get('/clients/contacts/', { params: { client: clientId } }),

    // Deals
    getDeals: (params) => api.get('/clients/deals/', { params }),
    createDeal: (data) => api.post('/clients/deals/', data),
    updateDeal: (id, data) => api.patch(`/clients/deals/${id}/`, data),
    deleteDeal: (id) => api.delete(`/clients/deals/${id}/`),
    getClientDeals: (clientId) => api.get('/clients/deals/', { params: { client: clientId } }),

    // Contracts
    getContracts: (params) => api.get('/clients/contracts/', { params }),
    createContract: (data) => api.post('/clients/contracts/', data),
    updateContract: (id, data) => api.patch(`/clients/contracts/${id}/`, data),
    deleteContract: (id) => api.delete(`/clients/contracts/${id}/`),
    getClientContracts: (clientId) => api.get('/clients/contracts/', { params: { client: clientId } }),
};
