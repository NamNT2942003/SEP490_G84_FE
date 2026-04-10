import axios from 'axios';

const DEFAULT_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://sep490-be-hbfwake2dud7a2at.southeastasia-01.azurewebsites.net/api';

const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
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
  async (error) => {
    const config = error.config || {};
    const method = (config.method || '').toLowerCase();
    const isLoginRequest = (config.url || '').includes('/auth/login');
    const shouldRetryOnce = !error.response
      && !config.__networkRetried
      && (method === 'get' || (method === 'post' && isLoginRequest));

    // Render free-tier cold starts may drop the first connection.
    if (shouldRetryOnce) {
      config.__networkRetried = true;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return apiClient.request(config);
    }

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
      const msg = `Network Error: could not reach backend (${base}). If this is Render, wait 30-60 seconds for cold start and try again.`;
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