/**
 * API gọi backend cho feature Service Management (List, View detail, Edit).
 */
import apiClient from '@/services/apiClient';

export const serviceAPI = {
  getAllServices: () => apiClient.get('/services'),
  getCategories: () => apiClient.get('/services/categories'),
  getServiceById: (id) => apiClient.get(`/services/${id}`),
  createService: (data) => apiClient.post('/services', data),
  updateService: (id, data) => apiClient.put(`/services/${id}`, data),
  deleteService: (id) => apiClient.delete(`/services/${id}`),
};
