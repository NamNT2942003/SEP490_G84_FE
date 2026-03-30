import React from 'react';
import { COLORS } from '@/constants';

const fmt = (val) => (val ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 0 }) + ' ₫';

const fmtTime = (datetimeStr) => {
  if (!datetimeStr) return '—';
  return new Date(datetimeStr).toLocaleString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const METHOD_LABEL = {
  CASH:     'Cash',
  CARD:     'Card',
  TRANSFER: 'Bank Transfer',
  STRIPE:   'Online',
};
const getMethod = (m) => METHOD_LABEL[m?.toUpperCase()] ?? (m || '—');

const TYPE_STYLE = {
  'Tiền phòng':   { color: '#0369a1', bg: '#e0f2fe', label: 'Room Charge' },
  'Tiền dịch vụ': { color: '#92400e', bg: '#fef3c7', label: 'Service Charge' },
};
const getTypeStyle = (t) => TYPE_STYLE[t] ?? { color: '#374151', bg: '#f3f4f6', label: t || '—' };

const CashflowTable = ({ items, loading, onSelectItem }) => {
  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border spinner-border-sm mb-2" style={{ color: COLORS.PRIMARY }} />
        <div style={{ fontSize: '0.88rem' }}>Loading transactions...</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-5 text-muted" style={{ fontSize: '0.88rem' }}>
        No transactions found for the selected period.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {['Txn ID', 'Date & Time', 'Branch', 'Booking', 'Type', 'Amount', 'Method', 'Collected by', ''].map((h) => (
              <th key={h} className="py-3 px-3 fw-semibold text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const ts = getTypeStyle(item.paymentType);
            return (
              <tr
                key={item.paymentId}
                style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                onClick={() => onSelectItem && onSelectItem(item)}
              >
                <td className="py-3 px-3" style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  PT-{item.paymentId}
                </td>
                <td className="py-3 px-3" style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                  {fmtTime(item.paidAt)}
                </td>
                <td className="py-3 px-3" style={{ color: '#374151' }}>
                  {item.branchName || '—'}
                </td>
                <td className="py-3 px-3" style={{ fontFamily: 'monospace', color: COLORS.PRIMARY, fontWeight: 600, fontSize: '0.82rem' }}>
                  {item.bookingCode || '—'}
                </td>
                <td className="py-3 px-3">
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: ts.color, background: ts.bg, padding: '2px 8px', borderRadius: 4 }}>
                    {ts.label}
                  </span>
                </td>
                <td className="py-3 px-3 fw-semibold" style={{ color: '#111827', whiteSpace: 'nowrap' }}>
                  {fmt(item.amount)}
                </td>
                <td className="py-3 px-3" style={{ color: '#374151' }}>
                  {getMethod(item.paymentMethod)}
                </td>
                <td className="py-3 px-3" style={{ color: '#6b7280' }}>
                  {item.staffName || 'N/A'}
                </td>
                <td className="py-3 px-3 text-end">
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: '0.78rem', color: COLORS.PRIMARY, background: 'transparent', border: `1px solid ${COLORS.PRIMARY}40`, borderRadius: 5, padding: '2px 10px' }}
                    onClick={(e) => { e.stopPropagation(); onSelectItem && onSelectItem(item); }}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CashflowTable;
