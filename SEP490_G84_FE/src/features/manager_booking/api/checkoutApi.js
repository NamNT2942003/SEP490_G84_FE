import axios from 'axios';
import { STORAGE_ACCESS_TOKEN } from '@/constants';

const BASE_URL = 'http://localhost:8081/api/checkout';

const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
  return { 'Authorization': `Bearer ${token}` };
};

export const checkoutApi = {
  getBillingInfo: async (bookingId) => {
    const response = await axios.get(`${BASE_URL}/bookings/${bookingId}/billing`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  processCheckout: async (bookingId) => {
    const response = await axios.post(`${BASE_URL}/bookings/${bookingId}/process`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};