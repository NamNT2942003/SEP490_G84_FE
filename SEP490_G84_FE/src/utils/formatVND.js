/**
 * Format số thành chuỗi tiền VND (ví dụ: 1.500.000 ₫)
 * @param {number} value - Số tiền
 * @returns {string}
 */
export function formatVND(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value));
}
