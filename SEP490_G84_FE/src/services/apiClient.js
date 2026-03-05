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

// Provide a clearer error message for network / connection refused cases
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If there is no response, it's likely a network error / backend unreachable
    if (!error.response) {
      const base = apiClient.defaults.baseURL || 'API server';
      const msg = `Network Error: could not reach backend (${base}). Ensure the backend is running and accessible.`;
      // attach a friendly message to the error object
      error.friendlyMessage = msg;
      // also log once to make debugging easier
      // eslint-disable-next-line no-console
      console.error(msg, error);
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;