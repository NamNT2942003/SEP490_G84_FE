import apiClient from '../../../services/apiClient';

export const paymentApi = {
    // Đã xóa chữ /api ở đầu đi
    createPayment: (invoiceId, method) => {
        return apiClient.post(`/payment/create?invoiceId=${invoiceId}&method=${method}`);
    }
};