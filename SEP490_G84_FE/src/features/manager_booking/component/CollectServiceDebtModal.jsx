import React, { useState } from 'react';
import { financeApi } from '../../finance/api/financeApi';
import Swal from 'sweetalert2';

/* ── Color tokens ── */
const C = {
  PRIMARY:       '#2e7d32',
  PRIMARY_HOVER: '#1b5e20',
  SECONDARY:     '#f0f2f0',
  TEXT_DARK:     '#333333',
  TEXT_LIGHT:    '#ffffff',
  ERROR:         '#dc3545',
  BORDER:        '#dde3dd',
  SURFACE:       '#ffffff',
  MUTED:         '#7a8a7b',
  GREEN_BG:      '#e8f5e9',
  GREEN_DARK:    '#1b5e20',
};

const radius = { sm: '8px', md: '12px', lg: '16px' };
const font = "'DM Sans', sans-serif";

export default function CollectServiceDebtModal({ show, onClose, booking, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !booking) return null;

  const serviceDebt = Number(booking.serviceDebtAmount || 0);
  const invoiceId = booking.serviceInvoiceId;

  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Bank Transfer' : 'Cash';

  const handleSubmit = async () => {
    if (serviceDebt <= 0 || !invoiceId) {
      Swal.fire('Info', 'No service debt to collect.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      await financeApi.collectDebt(invoiceId, {
        amount: serviceDebt,
        paymentMethod,
      });
      Swal.fire({
        icon: 'success',
        title: 'Service Debt Collected!',
        text: `${serviceDebt.toLocaleString('vi-VN')} ₫ collected via ${methodLabel(paymentMethod)}.`,
        timer: 2500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Collection Failed',
        text: err.response?.data?.error || err.response?.data?.message || 'An error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(30,38,30,0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', fontFamily: font,
    }}>
      <div style={{
        background: C.SURFACE, borderRadius: radius.lg,
        width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.TEXT_DARK, letterSpacing: '-0.2px' }}>
              🛎 Collect Service Debt
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: C.MUTED }}>
              {booking.bookingCode} — {booking.guestName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: radius.sm,
              border: `1.5px solid ${C.BORDER}`, background: 'transparent',
              cursor: 'pointer', color: C.MUTED, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: font,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Amount */}
          <div style={{
            background: C.GREEN_BG, border: `1.5px solid #81c784`,
            borderRadius: radius.md, padding: '18px 20px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Service Debt Summary
              </span>
              <span style={{ fontSize: '11px', color: C.GREEN_DARK, fontWeight: 500,
                background: '#a5d6a7', padding: '2px 8px', borderRadius: '12px' }}>
                Unpaid Services
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
              <span style={{ fontSize: '14px', color: C.GREEN_DARK, fontWeight: 700 }}>Amount Due</span>
              <span style={{ fontSize: '20px', color: C.ERROR, fontWeight: 800 }}>{serviceDebt.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.5px',
              color: C.MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '10px',
            }}>
              Payment Method
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { val: 'CASH', label: 'Cash', icon: '💵' },
                { val: 'CARD', label: 'Card', icon: '💳' },
                { val: 'TRANSFER', label: 'Bank Transfer', icon: '🏦' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => !isSubmitting && setPaymentMethod(opt.val)}
                  disabled={isSubmitting}
                  style={{
                    flex: 1, padding: '12px 10px', borderRadius: radius.sm,
                    border: `2px solid ${paymentMethod === opt.val ? C.PRIMARY : C.BORDER}`,
                    background: paymentMethod === opt.val ? '#f0f5f0' : C.SURFACE,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontFamily: font, fontSize: '12.5px', fontWeight: 600,
                    color: paymentMethod === opt.val ? C.PRIMARY : C.TEXT_DARK,
                    transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.BORDER}`,
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          background: C.SURFACE,
        }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px', borderRadius: radius.sm,
              border: `1.5px solid ${C.BORDER}`, background: C.SURFACE,
              color: C.TEXT_DARK, fontSize: '13.5px', fontWeight: 600,
              cursor: 'pointer', fontFamily: font,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || serviceDebt <= 0}
            style={{
              padding: '10px 22px', borderRadius: radius.sm, border: 'none',
              background: isSubmitting || serviceDebt <= 0 ? '#b8c4b8' : C.PRIMARY,
              color: C.TEXT_LIGHT, fontSize: '13.5px', fontWeight: 700,
              cursor: isSubmitting || serviceDebt <= 0 ? 'not-allowed' : 'pointer',
              fontFamily: font,
            }}
          >
            {isSubmitting ? 'Processing...' : `Collect ${serviceDebt.toLocaleString('vi-VN')} ₫`}
          </button>
        </div>
      </div>
    </div>
  );
}
