import React, { useState, useEffect } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';

const fmt = (val) => (val ?? 0).toLocaleString('vi-VN') + ' ₫';

const fmtTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const METHOD_MAP = {
  CASH:     { label: 'Cash',          color: '#16a34a' },
  CARD:     { label: 'Card',          color: '#2563eb' },
  TRANSFER: { label: 'Bank Transfer', color: '#7c3aed' },
  STRIPE:   { label: 'Online',        color: '#635bff' },
};

const ITEM_TYPE_MAP = {
  ROOM:      { label: 'Room Charge',   bg: '#eff6ff', color: '#1d4ed8' },
  SERVICE:   { label: 'Service',       bg: '#fef3c7', color: '#d97706' },
  SURCHARGE: { label: 'Surcharge',     bg: '#fff7ed', color: '#ea580c' },
  DAMAGE:    { label: 'Damage',        bg: '#fee2e2', color: '#991b1b' },
  TAX:       { label: 'Tax / Fee',     bg: '#f5f3ff', color: '#7c3aed' },
  DISCOUNT:  { label: 'Discount',      bg: '#f0fdf4', color: '#16a34a' },
};
const getItemType = (t) => ITEM_TYPE_MAP[t?.toUpperCase()] ?? { label: t ?? '—', bg: '#f3f4f6', color: '#374151' };

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

const CashflowDetailDrawer = ({ payment, onClose }) => {
  const [breakdown, setBreakdown] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const isOpen = !!payment;

  useEffect(() => {
    if (!payment) return;
    setBreakdown([]);
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const data = await financeApi.getCashflowDetail(payment.paymentId);
        setBreakdown(data || []);
      } catch (err) {
        console.error('[CashflowDetailDrawer]', err);
        setBreakdown([]);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [payment?.paymentId]);

  const method = METHOD_MAP[payment?.paymentMethod?.toUpperCase()] ?? {};

  const typeLabel = payment?.paymentType || '—';

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
          background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY}cc 100%)`,
          color: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>
              Transaction Detail
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: '1rem',
              lineHeight: '30px', textAlign: 'center',
            }}>×</button>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {fmt(payment?.amount)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, marginRight: 8, fontFamily: 'monospace' }}>
              PT-{payment?.paymentId}
            </span>
            {payment?.bookingCode}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          <Section title="Transaction Info">
            <InfoRow label="Transaction ID" value={`PT-${payment?.paymentId}`} valueStyle={{ fontFamily: 'monospace', color: COLORS.PRIMARY }} />
            {payment?.providerTxnId && (
              <InfoRow label="Bank Txn ID" value={payment.providerTxnId} valueStyle={{ fontFamily: 'monospace', fontWeight: 700 }} />
            )}
            <InfoRow label="Payment Method" value={
              <span style={{ color: method.color, fontWeight: 700 }}>{method.label ?? payment?.paymentMethod}</span>
            } />
            <InfoRow label="Status" value={
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
                {payment?.paymentStatus}
              </span>
            } />
            <InfoRow label="Collected at" value={fmtTime(payment?.paidAt)} />
            <InfoRow label="Collected by" value={`${payment?.staffName ?? 'N/A'}${payment?.staffId ? ` (ID: ${payment.staffId})` : ''}`} />
          </Section>

          <Section title="Reference Info">
            <InfoRow label="Branch" value={payment?.branchName} valueStyle={{ color: COLORS.PRIMARY }} />
            <InfoRow label="Booking Code" value={payment?.bookingCode} valueStyle={{ fontFamily: 'monospace', color: COLORS.PRIMARY }} />
            <InfoRow label="Room(s)" value={payment?.roomNames} valueStyle={{ fontWeight: 700 }} />
            <InfoRow label="Checkout date" value={payment?.departureDate ? fmtTime(payment.departureDate) : null} />
            <InfoRow label="Charge type" value={
              <span style={{
                background: typeLabel === 'Room Charge' ? '#e0f2fe'
                          : typeLabel === 'Damage Compensation' ? '#fee2e2'
                          : '#fef3c7',
                color: typeLabel === 'Room Charge' ? '#0369a1'
                     : typeLabel === 'Damage Compensation' ? '#991b1b'
                     : '#92400e',
                padding: '2px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              }}>
                {typeLabel}
              </span>
            } />
          </Section>

          <Section title="Breakdown">
            {loadingDetail ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: COLORS.PRIMARY }} />
              </div>
            ) : breakdown.length === 0 ? null : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {breakdown.map((line, i) => {
                  const ts = getItemType(line.itemType);
                  return (
                    <div key={i} style={{
                      background: ts.bg, borderRadius: 8, padding: '10px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ts.color, marginBottom: 2 }}>
                          {ts.label}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#374151' }}>
                          {line.description}
                          {line.quantity > 1 && <span style={{ color: '#9ca3af', marginLeft: 6 }}>×{line.quantity}</span>}
                        </div>
                        {line.roomName && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
                            Room {line.roomName}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1f2937' }}>
                          {fmt(line.lineTotal)}
                        </div>
                        {!line.paid && (
                          <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 2 }}>Unpaid</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={{
                  borderTop: '2px solid #e5e7eb', paddingTop: 10,
                  display: 'flex', justifyContent: 'space-between',
                  fontWeight: 700, fontSize: '0.95rem',
                }}>
                  <span style={{ color: '#6b7280' }}>Total</span>
                  <span style={{ color: '#16a34a' }}>
                    {fmt(breakdown.reduce((s, l) => s + (l.lineTotal ?? 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </Section>

        </div>
      </div>
    </>
  );
};

export default CashflowDetailDrawer;
