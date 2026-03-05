import apiClient from '@/services/apiClient';

export const forgotPass = {
  forgotPassword: (email) => {
    // Backend đang chờ: POST /api/password/forgot với body { "email": "..." }
    return apiClient.post('/password/forgot', { email });
  },
  // Hàm đổi mật khẩu (Dùng cho trang ResetPassword sau này)
  resetPassword: (token, password) => {
    return apiClient.post('/password/reset', { token, password });
  }
};