import React from 'react';
import { COLORS } from '@/constants';

const fmt = (val) =>
  (val ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 0 }) + ' ₫';

const fmtDate = (datetimeStr) => {
  if (!datetimeStr) return '—';
  return new Date(datetimeStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Invoice status styles
const STATUS_MAP = {
  PAID: {
    label: 'Đã Thanh Toán',
    color: '#16a34a',
    bg: '#d1fae5',
    icon: 'bi-check-circle-fill',
  },
  UNPAID: {
    label: 'Chưa Thu',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: 'bi-x-circle-fill',
  },
  OPEN: {
    label: 'Đang Mở (DV)',
    color: '#d97706',
    bg: '#fef3c7',
    icon: 'bi-clock-fill',
  },
  PENDING: {
    label: 'Chờ Online',
    color: '#0369a1',
    bg: '#e0f2fe',
    icon: 'bi-hourglass-split',
  },
  PARTIAL: {
    label: 'Thu Một Phần',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: 'bi-circle-half',
  },
  CANCELLED: {
    label: 'Đã Hủy',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: 'bi-dash-circle-fill',
  },
};
const getStatus = (s) =>
  STATUS_MAP[s?.toUpperCase()] ?? {
    label: s ?? '—',
    color: '#374151',
    bg: '#f3f4f6',
    icon: 'bi-circle',
  };

// Invoice type styles
const TYPE_MAP = {
  ROOM: { label: 'Tiền Phòng', color: '#0369a1', bg: '#e0f2fe' },
  SERVICE: { label: 'Dịch Vụ', color: '#92400e', bg: '#fef3c7' },
  CHECKOUT: { label: 'Checkout', color: '#1f2937', bg: '#f3f4f6' },
  DAMAGE: { label: 'Bồi Thường', color: '#991b1b', bg: '#fee2e2' },
};
const getType = (t) =>
  TYPE_MAP[t?.toUpperCase()] ?? { label: t ?? '—', color: '#374151', bg: '#f3f4f6' };

const HEADERS = [
  'Mã HĐ',
  'Ngày Tạo',
  'Booking',
  'Khách',
  'Chi Nhánh',
  'Loại HĐ',
  'Trạng Thái',
  'Tổng Tiền',
  'Đã Thu',
  'Còn Nợ',
  '',
];

const ProgressBar = ({ collected, total }) => {
  const pct = total > 0 ? Math.min((collected / total) * 100, 100) : 0;
  const color =
    pct >= 100
      ? '#16a34a'
      : pct > 0
      ? '#eab308'
      : '#ef4444';

  return (
    <div
      style={{
        height: 4,
        background: '#e5e7eb',
        borderRadius: 99,
        overflow: 'hidden',
        marginTop: 4,
        width: 80,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

const RevenueInvoiceTable = ({
  items,
  loading,
  onSelectItem,
  page,
  totalPages,
  totalElements,
  setPage,
}) => {
  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <div
          className="spinner-border spinner-border-sm mb-2"
          style={{ color: COLORS.PRIMARY }}
        />
        <div style={{ fontSize: '0.88rem' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: '#9ca3af' }}>
        <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Không có hóa đơn nào</div>
        <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
          Thử thay đổi bộ lọc để tìm kết quả
        </div>
      </div>
    );
  }

  const pageSize = 10;

  return (
    <div className="table-responsive">
      <table
        className="table table-hover mb-0"
        style={{ fontSize: '0.86rem' }}
      >
        <thead style={{ background: '#f8f9fb' }}>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="py-3 px-3"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6c757d',
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const st = getStatus(item.status);
            const tp = getType(item.invoiceType);
            const outstanding = (item.totalAmount ?? 0) - (item.collectedAmount ?? 0);

            return (
              <tr
                key={item.invoiceId}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.12s',
                }}
                onClick={() => onSelectItem && onSelectItem(item)}
              >
                {/* Invoice ID */}
                <td
                  className="py-3 px-3"
                  style={{
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  INV-{item.invoiceId}
                </td>

                {/* Date */}
                <td className="py-3 px-3" style={{ whiteSpace: 'nowrap', color: '#374151' }}>
                  {fmtDate(item.createdAt)}
                </td>

                {/* Booking code */}
                <td className="py-3 px-3">
                  <span
                    style={{
                      fontFamily: 'monospace',
                      color: COLORS.PRIMARY,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    {item.bookingCode || '—'}
                  </span>
                  {item.bookingStatus && (
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>
                      {item.bookingStatus}
                    </div>
                  )}
                </td>

                {/* Customer */}
                <td className="py-3 px-3" style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                  {item.customerName || '—'}
                </td>

                {/* Branch */}
                <td className="py-3 px-3" style={{ color: '#374151' }}>
                  {item.branchName || '—'}
                </td>

                {/* Invoice type */}
                <td className="py-3 px-3">
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: tp.color,
                      background: tp.bg,
                      padding: '3px 10px',
                      borderRadius: 20,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tp.label}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-3">
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: st.color,
                      background: st.bg,
                      padding: '3px 10px',
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      width: 'fit-content',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <i className={`bi ${st.icon}`} style={{ fontSize: '0.72rem' }} />
                    {st.label}
                  </span>
                </td>

                {/* Total */}
                <td
                  className="py-3 px-3 fw-semibold"
                  style={{ color: '#111827', whiteSpace: 'nowrap' }}
                >
                  {fmt(item.totalAmount)}
                </td>

                {/* Collected */}
                <td className="py-3 px-3" style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    {fmt(item.collectedAmount)}
                  </span>
                  <ProgressBar
                    collected={item.collectedAmount ?? 0}
                    total={item.totalAmount ?? 0}
                  />
                </td>

                {/* Outstanding */}
                <td className="py-3 px-3" style={{ whiteSpace: 'nowrap' }}>
                  {outstanding > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      {fmt(outstanding)}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>

                {/* Action */}
                <td className="py-3 px-3 text-end">
                  <button
                    className="btn btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '3px 12px',
                      background: COLORS.PRIMARY + '15',
                      color: COLORS.PRIMARY,
                      border: `1px solid ${COLORS.PRIMARY}30`,
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem && onSelectItem(item);
                    }}
                  >
                    <i className="bi bi-eye me-1" />
                    Chi tiết
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="d-flex justify-content-between align-items-center py-2 px-4 border-top"
          style={{ background: '#fff' }}
        >
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            Hiển thị {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}{' '}
            / {totalElements} hóa đơn
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="bi bi-chevron-left me-1" />
              Trước
            </button>
            <span
              className="text-muted small d-flex align-items-center"
              style={{ fontSize: '0.82rem' }}
            >
              Trang {page + 1} / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
              <i className="bi bi-chevron-right ms-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueInvoiceTable;
