const BASE_URL = 'http://localhost:8081/api/finance';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildQuery = (params) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
};

export const financeApi = {
  /**
   * Lấy danh sách giao dịch thu tiền
   * @param {Object} filters - { startDate, endDate, paymentMethod, branchId }
   */
  getCashflow: async (filters = {}) => {
    const res = await fetch(`${BASE_URL}/cashflow${buildQuery(filters)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi tải danh sách giao dịch');
    return res.json();
  },

  /**
   * Lấy tổng kết dòng tiền (summary cards)
   * @param {Object} filters - { startDate, endDate, paymentMethod, branchId }
   */
  getCashflowSummary: async (filters = {}) => {
    const res = await fetch(`${BASE_URL}/cashflow/summary${buildQuery(filters)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi tải tổng kết dòng tiền');
    return res.json();
  },

  /**
   * Lấy breakdown chi tiết của 1 giao dịch (dành cho Detail Drawer)
   * @param {number} paymentId
   */
  getCashflowDetail: async (paymentId) => {
    const res = await fetch(`${BASE_URL}/cashflow/${paymentId}/detail`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi tải chi tiết giao dịch');
    return res.json();
  },
};
