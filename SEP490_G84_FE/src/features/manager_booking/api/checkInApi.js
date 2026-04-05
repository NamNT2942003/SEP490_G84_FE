import axios from 'axios';

import { STORAGE_ACCESS_TOKEN } from '@/constants';


// Đổi port này nếu Spring Boot của bạn chạy port khác (VD: 8080)
const API_BASE_URL = 'http://localhost:8081/api/front-desk';

// Hàm lấy Token để nhét vào Header (vì BE của bạn dùng JWT)
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const checkInApi = {
  // 1. Lấy danh sách booking
  getDashboardBookings: async (branchId, status) => {
    const params = { branchId };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/bookings`, {
      params,
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 2. Lấy danh sách phòng rảnh để đổ vào form Check-in
  getAvailableRooms: async (branchId) => {
    const response = await axios.get(`${API_BASE_URL}/rooms/available`, {
      params: { branchId },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 3. Thực hiện Check-in
  processCheckIn: async (bookingId, payload) => {
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/check-in`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 4. Đánh dấu khách đến & Gửi hành lý
  markAsArrived: async (bookingId, luggageNote) => {
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/mark-arrived`, { luggageNote }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 5. Undo Check-in
  undoCheckIn: async (bookingId) => {
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/undo-checkin`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 6. Update thông tin khách
  updateGuestInfo: async (guestId, payload) => {
    const response = await axios.put(`${API_BASE_URL}/guests/${guestId}`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 7. Lấy danh sách cơ sở mà user quản lý
  getMyBranches: async () => {
    const response = await axios.get(`${API_BASE_URL}/my-branches`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 8. Gửi email cảnh báo No-Show (không đổi status)
  notifyNoShow: async (bookingId) => {
    const response = await axios.post(`http://localhost:8081/api/bookings/${bookingId}/notify-noshow`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 9. Đổi trạng thái booking thành NO_SHOW (không gửi email)
  markNoShow: async (bookingId) => {
    const response = await axios.put(`http://localhost:8081/api/bookings/${bookingId}/no-show`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 10. Gửi email nhắc nhở checkout (không đổi status)
  notifyCheckout: async (bookingId) => {
    const response = await axios.post(`http://localhost:8081/api/bookings/${bookingId}/notify-checkout`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 11. Lấy bộ thống kê dashboard cards (logic tính toán từ BE)
  getDashboardStats: async (branchId) => {
    const response = await axios.get(`${API_BASE_URL}/stats`, {
      params: { branchId },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 12. Kiểm tra hạng phòng mới có đủ tồn kho cho toàn bộ số đêm của booking không
  checkUpgradeAvailability: async (bookingId, newRoomTypeName) => {
    const response = await axios.get(`${API_BASE_URL}/rooms/check-upgrade`, {
      params: { bookingId, newRoomTypeName },
      headers: getAuthHeaders()
    });
    return response.data; // { available: true/false }
  },

};