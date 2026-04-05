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
  'Room Charge':           { color: '#0369a1', bg: '#e0f2fe', label: 'Room Charge' },
  'Service Charge':        { color: '#92400e', bg: '#fef3c7', label: 'Service Charge' },
  'Damage Compensation':   { color: '#991b1b', bg: '#fee2e2', label: 'Damage Compensation' },
};
const getTypeStyle = (t) => TYPE_STYLE[t] ?? { color: '#374151', bg: '#f3f4f6', label: t || '—' };

const CashflowTable = ({ items, loading, onSelectItem, page, totalPages, totalElements, setPage }) => {
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

  const pageSize = 10;

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
        <thead style={{ background: '#f8f9fb' }}>
          <tr>
            {['Txn ID', 'Date & Time', 'Branch', 'Booking', 'Type', 'Amount', 'Method', 'Collected by', ''].map((h) => (
              <th key={h} className="py-3 px-3" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6c757d', border: 'none', whiteSpace: 'nowrap' }}>{h}</th>
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
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                    onClick={(e) => { e.stopPropagation(); onSelectItem && onSelectItem(item); }}
                  >
                    <i className="bi bi-eye me-1" />View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center py-2 px-3 border-top" style={{ background: '#fff' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements} transactions
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary pagination-btn"
              disabled={page <= 0}
              onClick={() => setPage(p => p - 1)}
            >
              <i className="bi bi-chevron-left me-1" />Prev
            </button>
            <span className="text-muted small d-flex align-items-center" style={{ fontSize: '0.82rem' }}>
              Page {page + 1} / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary pagination-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next<i className="bi bi-chevron-right ms-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowTable;
