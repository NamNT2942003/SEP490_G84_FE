import axios from 'axios';
import { STORAGE_ACCESS_TOKEN } from '@/constants';

const BASE_URL_API = '/api';

const apiClient = axios.create({
  baseURL: BASE_URL_API,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const withCurrentUser = (params, currentUserId) =>
  currentUserId != null ? { ...params, currentUserId } : params;

export const accountAPI = {
  getAllAccounts: (params = {}) => apiClient.get('/accounts', { params }),
  getAccountById: (id, params = {}) => apiClient.get(`/accounts/${id}`, { params }),
  createAccount: (data, currentUserId) =>
    apiClient.post('/accounts', data, { params: withCurrentUser({}, currentUserId) }),
  updateAccount: (id, data, currentUserId) =>
    apiClient.put(`/accounts/${id}`, data, { params: withCurrentUser({}, currentUserId) }),
  updateAccountStatus: (id, status, currentUserId) =>
    apiClient.patch(`/accounts/${id}/status`, { status }, { params: withCurrentUser({}, currentUserId) }),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.patch(`/accounts/${id}/avatar`, formData);
  },
  getBaseURL: () => window.location.origin,
  deleteAccount: (id, currentUserId) =>
    apiClient.delete(`/accounts/${id}`, { params: withCurrentUser({}, currentUserId) }),
  filterAccounts: (params) => apiClient.get('/accounts/filter', { params }),
  searchAccounts: (fullName) => apiClient.get('/accounts/search', { params: { fullName } }),
  getAccountsByStatus: (status) => apiClient.get(`/accounts/status/${status}`),
  getAccountsByBranch: (branchId) => apiClient.get(`/accounts/branch/${branchId}`),
};

export const branchAPI = {
  getAllBranches: () => apiClient.get('/branches'),
};

export default apiClient;
