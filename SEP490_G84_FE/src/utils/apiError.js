export const parseApiError = (error, fallback = "Request failed.") => {
  if (!error) return fallback;

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  if (error.friendlyMessage) {
    return error.friendlyMessage;
  }

  return error.message || fallback;
};
