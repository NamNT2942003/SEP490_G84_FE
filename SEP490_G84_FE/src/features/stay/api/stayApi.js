import apiClient from '@/services/apiClient';

export const stayApi = {
  getActiveBookings: async (branchId) => {
    try {
      const { data } = await apiClient.get('/stay/active-bookings', {
        params: { branchId: branchId || '' }
      });
      return data;
    } catch (error) {
      console.error('Error fetching in-house list:', error);
      throw error;
    }
  },

  getServices: async () => {
    try {
      const { data } = await apiClient.get('/stay/services');
      return data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  addServiceToStay: async (payload) => {
    try {
      const { data } = await apiClient.post('/stay/add-service', payload);
      return data;
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  },

  cancelService: async (orderId) => {
    try {
      const { data } = await apiClient.put(`/stay/cancel-service/${orderId}`);
      return data;
    } catch (error) {
      console.error('Error cancelling service:', error);
      throw error;
    }
  },

  getAvailableRooms: async (branchId, stayId) => {
    try {
      const { data } = await apiClient.get('/stay/available-rooms', {
        params: {
          branchId: branchId || '',
          stayId: stayId || ''
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      throw error;
    }
  },

  changeRoom: async (payload) => {
    try {
      const { data } = await apiClient.post('/stay/change-room', payload);
      return data;
    } catch (error) {
      console.error('Error changing room:', error);
      throw error;
    }
  },

  reportDamage: async (payload) => {
    try {
      const { data } = await apiClient.post('/stay/report-damage', payload);
      return data;
    } catch (error) {
      console.error('Error reporting damage:', error);
      throw error;
    }
  }
};