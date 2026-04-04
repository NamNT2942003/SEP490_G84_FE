import apiClient from '@/services/apiClient';

export const profileAPI = {
  getMyProfile: () => apiClient.get('/profile/me'),
  updateMyProfile: (data) => apiClient.put('/profile/me', data),
  changePassword: (data) => apiClient.post('/profile/change-password', data),
};