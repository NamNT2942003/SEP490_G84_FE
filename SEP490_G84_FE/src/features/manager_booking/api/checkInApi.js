import axios from 'axios';

import { STORAGE_ACCESS_TOKEN } from '@/constants';


// Đổi port này nếu Spring Boot của bạn chạy port khác (VD: 8080)
const API_BASE_URL = 'http://localhost:8081/api/front-desk';

// Hàm lấy Token để nhét vào Header (vì BE của bạn dùng JWT)
const getAuthHeaders = () => {
  // Tùy vào cách bạn lưu token lúc đăng nhập (localStorage hoặc Redux)
  // Giả sử bạn lưu trong localStorage với key là 'accessToken'
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
    if (status) params.status = status; // Nếu truyền status thì mới map vào URL
    
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

  // 3. Thực hiện Check-in (Đã sửa lại để nhận cả phụ thu)
  processCheckIn: async (bookingId, payload) => {
    // payload bây giờ là 1 object { assignments, earlyCheckInFee, earlyCheckInNote }
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/check-in`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // 4. Đánh dấu khách đến & Gửi hành lý (API mới)
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
  updateGuestInfo: async (guestId, payload) => {
    const response = await axios.put(`${API_BASE_URL}/guests/${guestId}`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

};