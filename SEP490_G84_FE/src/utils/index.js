/**
 * UTILS – Hàm tiện ích dùng chung (helper functions)
 *
 * Chỉ chứa các hàm xử lý/format dữ liệu, không chứa gọi API.
 * Ví dụ: format tiền VND, format ngày tháng, validate, v.v.
 *
 * API của từng feature nằm trong features/<tên-feature>/api/
 * (ví dụ: features/accounts/api/, features/auth/api/)
 */

export { formatVND } from './formatVND';
export { formatDate } from './formatDate';
