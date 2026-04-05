import axios from 'axios';
import { STORAGE_ACCESS_TOKEN } from '@/constants'; // Import key chứa token của em

const BASE_URL = 'http://localhost:8081/api/stay';

// Hàm helper để tự động lấy token nhét vào header
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const stayApi = {
  getActiveBookings: async (branchId) => {
    try {
      const response = await axios.get(`${BASE_URL}/active-bookings`, {
        params: { branchId: branchId || '' },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi fetch danh sách in-house:', error);
      throw error;
    }
  },

  getServices: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/services`, { headers: getAuthHeaders() });
      return response.data; 
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dịch vụ:', error);
      throw error;
    }
  },

  addServiceToStay: async (payload) => {
    try {
      const response = await axios.post(`${BASE_URL}/add-service`, payload, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gọi thêm dịch vụ:', error);
      throw error;
    }
  },

  cancelService: async (orderId) => {
    try {
      const response = await axios.put(`${BASE_URL}/cancel-service/${orderId}`, {}, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi hủy dịch vụ:', error);
      throw error;
    }
  },

  // ==========================================
  // 2 HÀM MỚI CHO NGHIỆP VỤ ĐỔI PHÒNG
  // ==========================================
  // Thêm stayId vào param
getAvailableRooms: async (branchId, stayId) => {
    try {
      const response = await axios.get(`${BASE_URL}/available-rooms`, {
        params: { 
            branchId: branchId || '',
            stayId: stayId || ''
        },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      // Viết logic catch tử tế vào đây
      console.error('Lỗi khi lấy danh sách phòng trống:', error);
      throw error; 
    }
  },

  changeRoom: async (payload) => {
    try {
      const response = await axios.post(`${BASE_URL}/change-room`, payload, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đổi phòng:', error);
      throw error;
    }
  },

  reportDamage: async (payload) => {
    try {
      const response = await axios.post(`${BASE_URL}/report-damage`, payload, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi báo cáo thiệt hại:', error);
      throw error;
    }
  }
};