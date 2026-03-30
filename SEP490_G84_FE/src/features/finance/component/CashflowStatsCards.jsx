import React from 'react';
import { COLORS } from '@/constants';

const fmt = (val) =>
  (val ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 0 }) + ' ₫';

const cards = [
  { key: 'totalAmount',    label: 'Total Revenue',    accent: COLORS.PRIMARY, sub: (d) => `${d.transactionCount} transaction${d.transactionCount !== 1 ? 's' : ''}` },
  { key: 'cashAmount',     label: 'Cash',             accent: '#16a34a',      sub: () => 'CASH' },
  { key: 'cardAmount',     label: 'Card',             accent: '#2563eb',      sub: () => 'CARD' },
  { key: 'transferAmount', label: 'Bank Transfer',    accent: '#7c3aed',      sub: () => 'TRANSFER' },
  { key: 'otherAmount',    label: 'Other',            accent: '#b45309',      sub: () => 'STRIPE / Online' },
];

const CashflowStatsCards = ({ summary, loading }) => (
  <div className="row g-3 mb-4">
    {cards.map((card) => (
      <div className="col-6 col-md" key={card.key}>
        <div className="card border-0 h-100" style={{
          borderRadius: 10,
          background: '#fff',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          borderTop: `3px solid ${card.accent}`,
        }}>
          <div className="card-body p-3">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#9ca3af', marginBottom: 8 }}>
              {card.label}
            </div>
            {loading ? (
              <div className="placeholder-glow">
                <span className="placeholder col-8" style={{ borderRadius: 4, height: 24 }} />
              </div>
            ) : (
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                {fmt(summary?.[card.key])}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
              {summary ? card.sub(summary) : '—'}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default CashflowStatsCards;
