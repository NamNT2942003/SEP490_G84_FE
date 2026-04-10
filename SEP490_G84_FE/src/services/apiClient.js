import axios from 'axios';

const apiClient = axios.create({
  // Use explicit IPv6 loopback to avoid "ERR_CONNECTION_REFUSED" when backend is bound to ::1 only.
  baseURL: 'https://sep490-g84-1.onrender.com/api',
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
    // Handle 401 Unauthorized — token expired or invalid
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the login/auth pages
      const isAuthRequest = error.config?.url?.includes('/auth/');
      if (!isAuthRequest) {
        localStorage.removeItem('accessToken');
        // Use window.location to hard redirect (works outside React Router context)
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

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