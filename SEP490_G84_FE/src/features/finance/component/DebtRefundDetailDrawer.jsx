import React, { useState, useEffect } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';

const fmt = (val) => (val ?? 0).toLocaleString('en-US') + ' VND';
const fmtTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
const fmtDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_STYLE = {
  CONFIRMED:   { bg: '#e0f2fe', color: '#0369a1' },
  CHECKED_IN:  { bg: '#d1fae5', color: '#065f46' },
  CHECKED_OUT: { bg: '#f3f4f6', color: '#374151' },
  CANCELLED:   { bg: '#fee2e2', color: '#991b1b' },
  NO_SHOW:     { bg: '#f3f4f6', color: '#111827' },
  PENDING:     { bg: '#fef3c7', color: '#92400e' },
  COMPLETED:   { bg: '#d1fae5', color: '#065f46' },
  UNPAID:      { bg: '#fee2e2', color: '#991b1b' },
  PAID:        { bg: '#d1fae5', color: '#065f46' },
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.8px', color: '#6b7280', marginBottom: 12,
      paddingBottom: 6, borderBottom: '1px solid #f0f0f0',
    }}>
      {title}
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, valueStyle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1f2937', textAlign: 'right', maxWidth: '60%', ...valueStyle }}>
      {value ?? '—'}
    </span>
  </div>
);

const DebtRefundDetailDrawer = ({ show, onClose, type, id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !id) return;
    setLoading(true);
    const fetcher = type === 'REFUND' ? financeApi.getRefundDetail(id) : financeApi.getDebtDetail(id);
    fetcher.then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [show, type, id]);

  const isOpen = show && !!id;
  const isRefund = type === 'REFUND';

  const getReason = () => {
    if (!data) return '';
    if (isRefund) {
      if (data.bookingStatus === 'CANCELLED') {
        return `Booking cancelled — refund ${data.snapshotRefundRate || 0}% of deposit`;
      }
      return 'Booking amended (room/night reduced) — refund excess payment';
    }
    if (data.invoiceType === 'SERVICE') {
      return 'Guest checked out with unpaid service charges';
    }
    return 'Guest checked out with unpaid room balance';
  };

  const headerAmount = isRefund ? data?.refundAmount : data?.debtRemaining;
  const statusStyle = STATUS_STYLE[data?.bookingStatus] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 1040, opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity 0.25s ease',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: '#fff', zIndex: 1050,
        boxShadow: '-6px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: isRefund
            ? `linear-gradient(135deg, #c62828 0%, #e53935cc 100%)`
            : `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY}cc 100%)`,
          color: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>
              {isRefund ? 'Refund Detail' : 'Debt Detail'}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: '1rem',
              lineHeight: '30px', textAlign: 'center',
            }}>×</button>
          </div>
          {data ? (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                {isRefund ? '-' : ''}{fmt(headerAmount)}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, marginRight: 8, fontFamily: 'monospace' }}>
                  {isRefund ? `INV-${data.invoiceId}` : `INV-${data.invoiceId}`}
                </span>
                {data.bookingCode}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.7 }}>Loading...</div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm" style={{ color: COLORS.PRIMARY }} />
            </div>
          )}

          {!loading && data && (
            <>
              {/* Reason */}
              <Section title="Reason">
                <div style={{
                  background: isRefund ? '#fef3c7' : '#e0f2fe',
                  borderRadius: 8, padding: '12px 14px',
                  fontSize: '0.88rem', fontWeight: 600, color: '#374151',
                  border: `1px solid ${isRefund ? '#fde68a' : '#bae6fd'}`,
                }}>
                  {getReason()}
                </div>
              </Section>

              {/* Booking Info */}
              <Section title="Booking Info">
                <InfoRow label="Booking Code" value={data.bookingCode} valueStyle={{ fontFamily: 'monospace', color: COLORS.PRIMARY }} />
                <InfoRow label="Status" value={
                  <span style={{
                    background: statusStyle.bg, color: statusStyle.color,
                    padding: '2px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
                  }}>{data.bookingStatus}</span>
                } />
                <InfoRow label="Guest Name" value={data.customerName} valueStyle={{ fontWeight: 700 }} />
                <InfoRow label="Phone" value={data.customerPhone} />
                {data.customerEmail && <InfoRow label="Email" value={data.customerEmail} />}
                <InfoRow label="Arrival" value={fmtDate(data.arrivalDate)} />
                <InfoRow label="Departure" value={fmtDate(data.departureDate)} />
                <InfoRow label="Booking Total" value={fmt(data.bookingTotalAmount)} valueStyle={{ color: COLORS.PRIMARY, fontWeight: 700 }} />
              </Section>

              {/* Calculation */}
              {isRefund && data.snapshotRefundRate != null && (
                <Section title="Calculation">
                  <InfoRow label="Deposit Paid" value={
                    data.payments?.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED')
                      .reduce((s, p) => s + p.amount, 0) > 0
                      ? fmt(data.payments.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED').reduce((s, p) => s + p.amount, 0))
                      : '—'
                  } />
                  <InfoRow label="Refund Rate" value={`${data.snapshotRefundRate}%`} valueStyle={{ fontWeight: 700 }} />
                  <div style={{
                    borderTop: '2px solid #e5e7eb', paddingTop: 10, marginTop: 4,
                    display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem',
                  }}>
                    <span style={{ color: '#6b7280' }}>Refund Amount</span>
                    <span style={{ color: '#dc2626' }}>{fmt(data.refundAmount)}</span>
                  </div>
                </Section>
              )}

              {!isRefund && (
                <Section title="Debt Breakdown">
                  <InfoRow label="Invoice Total" value={fmt(data.invoiceTotalAmount)} />
                  <InfoRow label="Amount Paid" value={
                    fmt((data.invoiceTotalAmount || 0) - (data.debtRemaining || 0))
                  } valueStyle={{ color: '#16a34a' }} />
                  <div style={{
                    borderTop: '2px solid #e5e7eb', paddingTop: 10, marginTop: 4,
                    display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem',
                  }}>
                    <span style={{ color: '#6b7280' }}>Remaining</span>
                    <span style={{ color: '#dc2626' }}>{fmt(data.debtRemaining)}</span>
                  </div>
                </Section>
              )}

              {/* Staff */}
              <Section title="Processed By">
                <InfoRow label={isRefund ? 'Staff' : 'Checkout Staff'} value={
                  data.staffName || '—'
                } valueStyle={{ fontWeight: 700 }} />
                <InfoRow label="Date/Time" value={
                  isRefund
                    ? fmtTime(data.payments?.find(p => p.amount < 0)?.createdAt)
                    : fmtTime(data.actualCheckOut || data.departureDate)
                } />
              </Section>
            </>
          )}

          {!loading && !data && (
            <div className="text-center py-5 text-muted" style={{ fontSize: '0.9rem' }}>
              No data found
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DebtRefundDetailDrawer;
