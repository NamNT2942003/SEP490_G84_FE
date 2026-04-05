import apiClient from '@/services/apiClient';

export const checkoutApi = {
  getBillingInfo: async (bookingId) => {
    const { data } = await apiClient.get(`/checkout/bookings/${bookingId}/billing`);
    return data;
  },

  getRoomBillingInfo: async (bookingId) => {
    const { data } = await apiClient.get(`/checkout/bookings/${bookingId}/room-billing`);
    return data;
  },

  processCheckout: async (bookingId, paymentMethod = 'CASH') => {
    const { data } = await apiClient.post(
      `/checkout/bookings/${bookingId}/process`,
      { paymentMethod }
    );
    return data;
  }
};