import apiClient from '../../../services/apiClient';

export const paymentApi = {
    // Gọi API Stripe để lấy URL Checkout
    createStripePayment: (orderData) => {
        return apiClient.post('/api/payment/create', orderData);
    },

    // Gọi API xử lý thanh toán COD (nếu có)
    createCodPayment: (orderData) => {
        return apiClient.post('/api/payment/cod', orderData);
    }
};