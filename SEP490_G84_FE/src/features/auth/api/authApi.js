import apiClient from '@/services/apiClient';

export const authApi = {
  login: async (credentials) => {
    // credentials = { username: "admin", password: "..." }
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
};