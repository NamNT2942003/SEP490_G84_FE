import apiClient from '@/services/apiClient';

export const profileAPI = {
  getMyProfile: () => apiClient.get('/profile/me'),
  updateMyProfile: (data) => apiClient.put('/profile/me', data),
  changePassword: (data) => apiClient.post('/profile/change-password', data),
  uploadAvatar: (formData) => apiClient.post('/profile/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};