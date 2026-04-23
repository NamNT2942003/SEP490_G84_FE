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

  processCheckout: async (bookingId, paymentMethod = 'CASH', allowServiceDebt = false) => {
    const { data } = await apiClient.post(
      `/checkout/bookings/${bookingId}/process`,
      { paymentMethod, allowServiceDebt: String(allowServiceDebt) }
    );
    return data;
  },

  /**
   * Checkout toàn bộ booking chia bill dịch vụ theo từng phòng (1 request).
   * payload: { roomPayments: [{ stayId, paymentMethod }] }
   */
  processSplitCheckout: async (bookingId, payload) => {
    const { data } = await apiClient.post(
      `/checkout/bookings/${bookingId}/process-split`,
      payload
    );
    return data;
  },

  /**
   * Checkout 1 phòng (Stay) riêng lẻ.
   * Booking vẫn CHECKED_IN cho đến khi phòng cuối cùng checkout.
   * payload: { stayId, paymentMethod }
   */
  checkoutSingleRoom: async (bookingId, payload) => {
    const { data } = await apiClient.post(
      `/checkout/bookings/${bookingId}/checkout-room`,
      payload
    );
    return data;
  },

  checkLateCheckoutFeasibility: async (bookingId) => {
    const { data } = await apiClient.get(`/checkout/bookings/${bookingId}/late-checkout-feasibility`);
    return data;
  },

  applyLateCheckoutSurcharges: async (bookingId, payload) => {
    const { data } = await apiClient.post(`/checkout/bookings/${bookingId}/late-checkout-surcharges`, payload);
    return data;
  }
};