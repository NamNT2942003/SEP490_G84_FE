/**
 * Format date thành chuỗi hiển thị (ví dụ: dd/MM/yyyy)
 * @param {string|Date} value - Ngày (ISO string hoặc Date)
 * @param {string} locale - Locale (mặc định vi-VN)
 * @returns {string}
 */
export function formatDate(value, locale = 'vi-VN') {
  if (value == null) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
