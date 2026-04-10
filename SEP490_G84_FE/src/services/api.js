import apiClient from "./apiClient";

// Re-export the main shared client so all modules use the same
// base URL and auth/error interceptors.
export default apiClient;
