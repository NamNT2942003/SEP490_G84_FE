import apiClient from '@/services/apiClient';

export const forgotPass = {
  // --- THÊM HÀM NÀY CHO FORGOT PASSWORD ---
  // Gửi email yêu cầu reset
  forgotPassword: (email) => {
    // Backend đang chờ: POST /api/password/forgot với body { "email": "..." }
    return apiClient.post('/password/forgot', { email });
  },
  // Hàm đổi mật khẩu (Dùng cho trang ResetPassword sau này)
  resetPassword: (token, password) => {
    return apiClient.post('/password/reset', { token, password });
  }
};