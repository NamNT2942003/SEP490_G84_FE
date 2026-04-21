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
};
