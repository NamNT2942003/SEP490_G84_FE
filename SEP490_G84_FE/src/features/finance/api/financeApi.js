import apiClient from '@/services/apiClient';

export const financeApi = {
  /**
   * Get cashflow transactions list
   * @param {Object} filters - { startDate, endDate, paymentMethod, branchId }
   */
  getCashflow: async (filters = {}) => {
    const { data } = await apiClient.get('/finance/cashflow', { params: filters });
    return data;
  },

  /**
   * Get cashflow summary (summary cards)
   * @param {Object} filters - { startDate, endDate, paymentMethod, branchId }
   */
  getCashflowSummary: async (filters = {}) => {
    const { data } = await apiClient.get('/finance/cashflow/summary', { params: filters });
    return data;
  },

  /**
   * Get breakdown detail of a transaction (for Detail Drawer)
   * @param {number} paymentId
   */
  getCashflowDetail: async (paymentId) => {
    const { data } = await apiClient.get(`/finance/cashflow/${paymentId}/detail`);
    return data;
  },

  /**
   * Get revenue invoice list (paginated)
   * @param {Object} filters - { startDate, endDate, status, invoiceType, branchId, page, size }
   */
  getRevenueInvoices: async (filters = {}) => {
    const { data } = await apiClient.get('/finance/revenue', { params: filters });
    return data;
  },

  /**
   * Get revenue collection summary cards
   * @param {Object} filters - { startDate, endDate, status, invoiceType, branchId }
   */
  getRevenueSummary: async (filters = {}) => {
    const { data } = await apiClient.get('/finance/revenue/summary', { params: filters });
    return data;
  },

  /**
   * Get invoice detail lines (for Detail Drawer)
   * @param {number} invoiceId
   */
  getRevenueInvoiceDetail: async (invoiceId) => {
    const { data } = await apiClient.get(`/finance/revenue/${invoiceId}/detail`);
    return data;
  },

  // ==================== Debt & Refund ====================

  /** Danh sách khoản hoàn tiền đang chờ xác nhận */
  getPendingRefunds: async () => {
    const { data } = await apiClient.get('/finance/pending-refunds');
    return data;
  },

  /** Xác nhận đã chuyển khoản hoàn tiền */
  confirmRefund: async (paymentId) => {
    const { data } = await apiClient.post(`/finance/refunds/${paymentId}/confirm`);
    return data;
  },

  /** Danh sách khách còn nợ tiền phòng */
  getOutstandingDebts: async () => {
    const { data } = await apiClient.get('/finance/outstanding-debts');
    return data;
  },

  /** Thu tiền nợ */
  collectDebt: async (invoiceId, body) => {
    const { data } = await apiClient.post(`/finance/debts/${invoiceId}/collect`, body);
    return data;
  },

  /** Chi tiết khoản hoàn tiền (cho Drawer) */
  getRefundDetail: async (paymentId) => {
    const { data } = await apiClient.get(`/finance/refund-detail/${paymentId}`);
    return data;
  },

  /** Chi tiết khoản nợ (cho Drawer) */
  getDebtDetail: async (invoiceId) => {
    const { data } = await apiClient.get(`/finance/debt-detail/${invoiceId}`);
    return data;
  },
};
