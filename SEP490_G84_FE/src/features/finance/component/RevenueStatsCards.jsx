import React from 'react';
import { COLORS } from '@/constants';

const fmt = (val) =>
  (val ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 0 }) + ' ₫';

const fmtCount = (val) =>
  (val ?? 0).toLocaleString('vi-VN');

const CARDS = [
  {
    key: 'totalBilled',
    label: 'Tổng Phải Thu',
    icon: 'bi-receipt',
    accent: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    format: fmt,
    sub: (d) => `${fmtCount(d.invoiceCount)} hóa đơn`,
  },
  {
    key: 'totalCollected',
    label: 'Đã Thu',
    icon: 'bi-check-circle-fill',
    accent: '#16a34a',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    format: fmt,
    sub: (d) => `${fmtCount(d.paidCount)} đã thanh toán`,
  },
  {
    key: 'totalOutstanding',
    label: 'Còn Nợ',
    icon: 'bi-exclamation-circle-fill',
    accent: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    format: fmt,
    sub: (d) => `${fmtCount(d.unpaidCount)} chưa thu`,
  },
];

const RevenueStatsCards = ({ summary, loading }) => (
  <div className="row g-3 mb-4">
    {CARDS.map((card) => (
      <div className="col-12 col-md-4" key={card.key}>
        <div
          className="card border-0 h-100"
          style={{
            borderRadius: 14,
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Accent strip on top */}
          <div style={{ height: 4, background: card.gradient }} />

          <div className="card-body p-3" style={{ position: 'relative' }}>
            {/* Icon badge */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 38,
                height: 38,
                borderRadius: 10,
                background: card.accent + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i
                className={`bi ${card.icon}`}
                style={{ fontSize: '1.1rem', color: card.accent }}
              />
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#9ca3af',
                marginBottom: 6,
              }}
            >
              {card.label}
            </div>

            {loading ? (
              <div className="placeholder-glow">
                <span
                  className="placeholder col-9"
                  style={{ borderRadius: 6, height: 28, display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#111827',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}
              >
                {card.format(summary?.[card.key])}
              </div>
            )}

            <div
              style={{
                fontSize: '0.72rem',
                color: '#9ca3af',
                marginTop: 6,
              }}
            >
              {summary ? card.sub(summary) : '—'}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default RevenueStatsCards;
