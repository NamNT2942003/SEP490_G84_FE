import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api', // Đổi port 8081 nếu backend bạn chạy port khác
  headers: {
    'Content-Type': 'application/json',
  },
});


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

export default apiClient;