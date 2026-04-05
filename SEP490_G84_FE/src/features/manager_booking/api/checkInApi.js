import apiClient from '@/services/apiClient';

export const checkInApi = {
  // 1. Get dashboard bookings
  getDashboardBookings: async (branchId, status) => {
    const params = { branchId };
    if (status) params.status = status;

    const { data } = await apiClient.get('/front-desk/bookings', { params });
    return data;
  },

  // 2. Get available rooms for check-in form
  getAvailableRooms: async (branchId) => {
    const { data } = await apiClient.get('/front-desk/rooms/available', {
      params: { branchId }
    });
    return data;
  },

  // 3. Process check-in
  processCheckIn: async (bookingId, payload) => {
    const { data } = await apiClient.post(`/front-desk/bookings/${bookingId}/check-in`, payload);
    return data;
  },

  // 4. Mark as arrived & luggage
  markAsArrived: async (bookingId, luggageNote) => {
    const { data } = await apiClient.post(`/front-desk/bookings/${bookingId}/mark-arrived`, { luggageNote });
    return data;
  },

  // 5. Undo check-in
  undoCheckIn: async (bookingId) => {
    const { data } = await apiClient.post(`/front-desk/bookings/${bookingId}/undo-checkin`);
    return data;
  },

  // 6. Update guest info
  updateGuestInfo: async (guestId, payload) => {
    const { data } = await apiClient.put(`/front-desk/guests/${guestId}`, payload);
    return data;
  },

  // 7. Get user's managed branches
  getMyBranches: async () => {
    const { data } = await apiClient.get('/front-desk/my-branches');
    return data;
  },

  // 8. Send no-show warning email (doesn't change status)
  notifyNoShow: async (bookingId) => {
    const { data } = await apiClient.post(`/bookings/${bookingId}/notify-noshow`);
    return data;
  },

  // 9. Mark booking as NO_SHOW (doesn't send email)
  markNoShow: async (bookingId) => {
    const { data } = await apiClient.put(`/bookings/${bookingId}/no-show`);
    return data;
  },

  // 10. Send checkout reminder email (doesn't change status)
  notifyCheckout: async (bookingId) => {
    const { data } = await apiClient.post(`/bookings/${bookingId}/notify-checkout`);
    return data;
  },

  // 11. Get dashboard stats
  getDashboardStats: async (branchId) => {
    const { data } = await apiClient.get('/front-desk/stats', {
      params: { branchId }
    });
    return data;
  },

  // 12. Check room upgrade availability
  checkUpgradeAvailability: async (bookingId, newRoomTypeName) => {
    const { data } = await apiClient.get('/front-desk/rooms/check-upgrade', {
      params: { bookingId, newRoomTypeName }
    });
    return data; // { available: true/false }
  },
};