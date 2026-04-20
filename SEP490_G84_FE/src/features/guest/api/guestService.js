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
     * Gửi yêu cầu nhận OTP xác thực để đặt phòng.
     * @param {string} email
     * @param {string} fullName
     */
    sendBookingOtp: async (email, fullName) => {
        const response = await apiClient.post(API_ENDPOINTS.GUEST.SEND_BOOKING_OTP, { email, fullName });
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

    /**
     * Gửi yêu cầu hủy booking của guest đang xác thực.
     * @param {string} token
     * @param {string} bookingCode
     */
    requestCancel: async (token, bookingCode) => {
        const endpoint = API_ENDPOINTS.GUEST.REQUEST_CANCEL.replace(":bookingCode", encodeURIComponent(bookingCode));
        const response = await apiClient.post(`${endpoint}?token=${encodeURIComponent(token)}`);
        return response.data;
    },
};
