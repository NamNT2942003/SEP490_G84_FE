/**
 * API gọi backend cho feature Accounts (Account List, Create, Edit, User Detail).
 * Chỉ chứa endpoint /accounts và /branches.
 */
import apiClient from '@/services/apiClient';

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
  getBaseURL: () => (typeof window !== 'undefined' ? window.location.origin : ''),
  deleteAccount: (id, currentUserId) =>
    apiClient.delete(`/accounts/${id}`, { params: withCurrentUser({}, currentUserId) }),
  filterAccounts: (params) => apiClient.get('/accounts/filter', { params }),
  searchAccounts: (fullName) => apiClient.get('/accounts/search', { params: { fullName } }),
  getAccountsByStatus: (status) => apiClient.get(`/accounts/status/${status}`),
  getAccountsByBranch: (branchId) => apiClient.get(`/accounts/branch/${branchId}`),
  getRoles: () => apiClient.get('/accounts/roles'),
  getStatuses: () => apiClient.get('/accounts/statuses'),
  getAssignableRoles: (currentUserId) =>
    apiClient.get('/accounts/assignable-roles', { params: currentUserId != null ? { currentUserId } : {} }),
};

export const branchAPI = {
  getAllBranches: () => apiClient.get('/branches'),
};
