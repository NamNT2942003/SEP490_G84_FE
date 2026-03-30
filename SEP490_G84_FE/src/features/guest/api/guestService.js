import apiClient from "../../../services/api.js";
import { API_ENDPOINTS } from "../../../constants/apiConfig.js";

export const guest = {
    /**
     * Gửi yêu cầu nhận OTP xác thực.
     * @param {string} email
     */
    requestAccess: async (email) => {
        const response = await apiClient.post(API_ENDPOINTS.GUEST.REQUEST_ACCESS, { email });
        return response.data;
    },

    /**
     * Xác thực OTP → nhận session token.
     * @param {string} email
     * @param {string} otp  - 6 chữ số
     * @returns {{ token: string }}
     */
    verifyOtp: async (email, otp) => {
        const response = await apiClient.post(API_ENDPOINTS.GUEST.VERIFY_OTP, { email, otp });
        return response.data; // { token: "uuid..." }
    },

    /**
     * Lấy danh sách booking theo session token.
     * @param {string} token
     */
    getBookingsByToken: async (token) => {
        const response = await apiClient.get(`${API_ENDPOINTS.GUEST.BOOKINGS}?token=${token}`);
        return response.data;
    },
};
