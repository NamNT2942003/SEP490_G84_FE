import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const accountAPI = {
  // Lấy tất cả accounts (với phân quyền nếu có currentUserId)
  getAllAccounts: (params = {}) => apiClient.get('/accounts', { params }),
  
  // Lấy account theo ID
  getAccountById: (id) => apiClient.get(`/accounts/${id}`),
  
  // Create new account
  createAccount: (data, currentUserId) => apiClient.post('/accounts', data, { params: { currentUserId } }),
  
  // Update account profile
  updateAccount: (id, data) => apiClient.put(`/accounts/${id}`, data),
  
  // Update status account
  updateAccountStatus: (id, status) => apiClient.patch(`/accounts/${id}/status`, { status }),
  
  // Delete account
  deleteAccount: (id) => apiClient.delete(`/accounts/${id}`),
  
  // Lọc accounts
  filterAccounts: (params) => apiClient.get('/accounts/filter', { params }),
  
  // Tìm kiếm accounts
  searchAccounts: (fullName) => apiClient.get('/accounts/search', { params: { fullName } }),
  
  // Lấy accounts theo status
  getAccountsByStatus: (status) => apiClient.get(`/accounts/status/${status}`),
  
  // Lấy accounts theo branch
  getAccountsByBranch: (branchId) => apiClient.get(`/accounts/branch/${branchId}`),
};

export const branchAPI = {
  // Lấy tất cả branches
  getAllBranches: () => apiClient.get('/branches'),
};

export default apiClient;
