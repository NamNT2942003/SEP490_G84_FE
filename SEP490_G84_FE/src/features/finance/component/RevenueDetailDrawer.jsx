import React, { useState, useEffect } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';

const fmt = (val) => (val ?? 0).toLocaleString('vi-VN') + ' ₫';

const fmtDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_MAP = {
  PAID:      { label: 'Đã Thanh Toán', color: '#16a34a', bg: '#d1fae5', icon: 'bi-check-circle-fill' },
  UNPAID:    { label: 'Chưa Thu',       color: '#dc2626', bg: '#fee2e2', icon: 'bi-x-circle-fill' },
  OPEN:      { label: 'Đang Mở',        color: '#d97706', bg: '#fef3c7', icon: 'bi-clock-fill' },
  PARTIAL:   { label: 'Thu Một Phần',   color: '#7c3aed', bg: '#f5f3ff', icon: 'bi-circle-half' },
  CANCELLED: { label: 'Đã Hủy',         color: '#6b7280', bg: '#f3f4f6', icon: 'bi-dash-circle-fill' },
};
const getStatus = (s) =>
  STATUS_MAP[s?.toUpperCase()] ?? { label: s ?? '—', color: '#374151', bg: '#f3f4f6', icon: 'bi-circle' };

const TYPE_MAP = {
  ROOM:     { label: 'Tiền Phòng',  color: '#0369a1', bg: '#e0f2fe' },
  SERVICE:  { label: 'Dịch Vụ',    color: '#92400e', bg: '#fef3c7' },
  CHECKOUT: { label: 'Checkout',    color: '#1f2937', bg: '#f3f4f6' },
  DAMAGE:   { label: 'Bồi Thường', color: '#991b1b', bg: '#fee2e2' },
};
const getType = (t) =>
  TYPE_MAP[t?.toUpperCase()] ?? { label: t ?? '—', color: '#374151', bg: '#f3f4f6' };

const METHOD_MAP = {
  CASH:     { label: 'Tiền Mặt',    color: '#16a34a' },
  CARD:     { label: 'Thẻ',         color: '#2563eb' },
  TRANSFER: { label: 'Chuyển Khoản',color: '#7c3aed' },
  STRIPE:   { label: 'Trực Tuyến',  color: '#635bff' },
};

const ITEM_TYPE_MAP = {
  ROOM:      { label: 'Tiền Phòng', bg: '#eff6ff', color: '#1d4ed8' },
  SERVICE:   { label: 'Dịch Vụ',   bg: '#fef3c7', color: '#d97706' },
  SURCHARGE: { label: 'Phụ Thu',   bg: '#fff7ed', color: '#ea580c' },
  DAMAGE:    { label: 'Bồi Thường',bg: '#fee2e2', color: '#991b1b' },
  TAX:       { label: 'Thuế / Phí',bg: '#f5f3ff', color: '#7c3aed' },
  DISCOUNT:  { label: 'Giảm Giá', bg: '#f0fdf4', color: '#16a34a' },
};
const getItemType = (t) =>
  ITEM_TYPE_MAP[t?.toUpperCase()] ?? { label: t ?? '—', bg: '#f3f4f6', color: '#374151' };

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div
      style={{
        fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.8px', color: '#6b7280', marginBottom: 12,
        paddingBottom: 8, borderBottom: '2px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, valueStyle }) => (
  <div
    style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 10, gap: 12,
    }}
  >
    <span style={{ fontSize: '0.84rem', color: '#6b7280', flexShrink: 0 }}>{label}</span>
    <span
      style={{
        fontSize: '0.88rem', fontWeight: 600, color: '#1f2937',
        textAlign: 'right', ...valueStyle,
      }}
    >
      {value ?? '—'}
    </span>
  </div>
);

const RevenueDetailDrawer = ({ invoice, onClose }) => {
  const [breakdown, setBreakdown] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const isOpen = !!invoice;

  useEffect(() => {
    if (!invoice) return;
    setBreakdown([]);
    const fetch = async () => {
      setLoadingDetail(true);
      try {
        const data = await financeApi.getRevenueInvoiceDetail(invoice.invoiceId);
        setBreakdown(data || []);
      } catch (err) {
        console.error('[RevenueDetailDrawer]', err);
        setBreakdown([]);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetch();
  }, [invoice?.invoiceId]);

  const st = getStatus(invoice?.status);
  const tp = getType(invoice?.invoiceType);
  const outstanding = (invoice?.totalAmount ?? 0) - (invoice?.collectedAmount ?? 0);

  // Group payments by method
  const payments = invoice?.payments ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 1040, opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
          background: '#fff', zIndex: 1050,
          boxShadow: '-6px 0 30px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`,
            color: '#fff', flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: '0.78rem', opacity: 0.85, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}
            >
              Chi Tiết Hóa Đơn
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, color: '#fff', cursor: 'pointer',
                fontSize: '1.1rem', lineHeight: '32px', textAlign: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Invoice ID + Booking code */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 10px', borderRadius: 20,
                fontFamily: 'monospace', fontSize: '0.88rem',
              }}
            >
              INV-{invoice?.invoiceId}
            </span>
            <span
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 10px', borderRadius: 20,
                fontFamily: 'monospace', fontSize: '0.82rem', opacity: 0.9,
              }}
            >
              {invoice?.bookingCode}
            </span>
          </div>

          {/* Total amount big */}
          <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {fmt(invoice?.totalAmount)}
          </div>

          {/* Collection bar */}
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.78rem', opacity: 0.9, marginBottom: 4,
              }}
            >
              <span>Đã thu: {fmt(invoice?.collectedAmount)}</span>
              <span>Còn nợ: {fmt(outstanding > 0 ? outstanding : 0)}</span>
            </div>
            <div
              style={{
                height: 6, background: 'rgba(255,255,255,0.25)',
                borderRadius: 99, overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${invoice?.totalAmount > 0
                    ? Math.min(((invoice?.collectedAmount ?? 0) / invoice.totalAmount) * 100, 100)
                    : 0}%`,
                  background: '#fff',
                  borderRadius: 99, transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>

          {/* Status + Type badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <span
              style={{
                fontSize: '0.78rem', fontWeight: 700,
                color: st.color, background: st.bg,
                padding: '4px 12px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <i className={`bi ${st.icon}`} style={{ fontSize: '0.7rem' }} />
              {st.label}
            </span>
            <span
              style={{
                fontSize: '0.78rem', fontWeight: 700,
                color: tp.color, background: tp.bg,
                padding: '4px 12px', borderRadius: 20,
              }}
            >
              {tp.label}
            </span>
          </div>

          <Section title="Thông Tin Booking">
            <InfoRow label="Mã Booking" value={invoice?.bookingCode}
              valueStyle={{ fontFamily: 'monospace', color: COLORS.PRIMARY }} />
            <InfoRow label="Khách" value={invoice?.customerName} />
            <InfoRow label="Chi Nhánh" value={invoice?.branchName}
              valueStyle={{ color: COLORS.PRIMARY }} />
            <InfoRow
              label="Phòng"
              value={invoice?.roomNames}
              valueStyle={{ fontWeight: 700 }}
            />
            <InfoRow
              label="Nhận phòng"
              value={fmtDate(invoice?.arrivalDate)}
            />
            <InfoRow
              label="Trả phòng"
              value={fmtDate(invoice?.departureDate)}
            />
          </Section>

          <Section title="Tiến Trình Thu Tiền">
            <div
              style={{
                background: '#f8f9fb', borderRadius: 10, padding: '14px 16px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Tổng phải thu</span>
                <span style={{ fontWeight: 700 }}>{fmt(invoice?.totalAmount)}</span>
              </div>
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>Đã thu</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>
                  {fmt(invoice?.collectedAmount)}
                </span>
              </div>
              {outstanding > 0 && (
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: 8, borderTop: '1px dashed #e5e7eb',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                    Còn nợ
                  </span>
                  <span style={{ fontWeight: 800, color: '#dc2626' }}>
                    {fmt(outstanding)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment history */}
            {payments.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 8,
                  }}
                >
                  Lịch Sử Thanh Toán
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {payments.map((p, i) => {
                    const m = METHOD_MAP[p.paymentMethod?.toUpperCase()] ?? {};
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8f9fb', borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>
                            PT-{p.paymentId}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                            {fmtDateTime(p.paidAt)} &nbsp;·&nbsp;
                            <span style={{ color: m.color ?? '#374151' }}>
                              {m.label ?? p.paymentMethod}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem' }}>
                          {fmt(p.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          <Section title="Chi Tiết Dòng">
            {loadingDetail ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: COLORS.PRIMARY }} />
              </div>
            ) : breakdown.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                Không có dữ liệu chi tiết
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {breakdown.map((line, i) => {
                  const ts = getItemType(line.itemType);
                  return (
                    <div
                      key={i}
                      style={{
                        background: ts.bg, borderRadius: 8, padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.78rem', fontWeight: 700,
                            color: ts.color, marginBottom: 2,
                          }}
                        >
                          {ts.label}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#374151' }}>
                          {line.description}
                          {line.quantity > 1 && (
                            <span style={{ color: '#9ca3af', marginLeft: 6 }}>
                              ×{line.quantity}
                            </span>
                          )}
                        </div>
                        {line.roomName && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                            Phòng {line.roomName}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1f2937' }}
                        >
                          {fmt(line.lineTotal)}
                        </div>
                        {!line.paid && (
                          <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 2 }}>
                            Chưa thu
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total row */}
                <div
                  style={{
                    borderTop: '2px solid #e5e7eb', paddingTop: 10, marginTop: 4,
                    display: 'flex', justifyContent: 'space-between',
                    fontWeight: 700, fontSize: '0.95rem',
                  }}
                >
                  <span style={{ color: '#6b7280' }}>Tổng cộng</span>
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

export default RevenueDetailDrawer;
