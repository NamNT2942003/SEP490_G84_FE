import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiConfig";

const buildPaymentPayload = ({ bookingId, amount, method }) => {
  if (!bookingId) {
    throw new Error("bookingId is required to create a payment");
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("amount must be a positive number");
  }

  if (!method) {
    throw new Error("payment method is required");
  }

  return {
    bookingId,
    amount: numericAmount,
    method,
  };
};

const paymentService = {
  createPayment: async ({ bookingId, amount, method }) => {
    const payload = buildPaymentPayload({ bookingId, amount, method });
    // Spring Boot's @RequestParam expects data in URL parameters, not JSON body
    const response = await apiClient.post(API_ENDPOINTS.PAYMENT.CREATE, null, { params: payload });
    return response.data;
  },
  getPaymentStatus: async (paymentId) => {
    const response = await apiClient.get(`${API_ENDPOINTS.PAYMENT.STATUS}/${paymentId}`);
    return response.data;
  },
};

export default paymentService;

