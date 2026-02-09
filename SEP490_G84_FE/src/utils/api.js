import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const accountAPI = {
  getAllAccounts: (params = {}) => apiClient.get('/accounts', { params }),
  getAccountById: (id) => apiClient.get(`/accounts/${id}`),
  createAccount: (data, currentUserId) => apiClient.post('/accounts', data, { params: { currentUserId } }),
  updateAccount: (id, data) => apiClient.put(`/accounts/${id}`, data),
  updateAccountStatus: (id, status) => apiClient.patch(`/accounts/${id}/status`, { status }),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.patch(`/accounts/${id}/avatar`, formData);
  },
  getBaseURL: () => (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '') || 'http://localhost:8081',
  deleteAccount: (id) => apiClient.delete(`/accounts/${id}`),
  filterAccounts: (params) => apiClient.get('/accounts/filter', { params }),
  searchAccounts: (fullName) => apiClient.get('/accounts/search', { params: { fullName } }),
  getAccountsByStatus: (status) => apiClient.get(`/accounts/status/${status}`),
  getAccountsByBranch: (branchId) => apiClient.get(`/accounts/branch/${branchId}`),
};

export const branchAPI = {
  getAllBranches: () => apiClient.get('/branches'),
};

export default apiClient;
