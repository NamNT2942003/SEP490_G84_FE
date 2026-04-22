import React, { useState } from 'react';
import { checkInApi } from '../api/checkInApi';
import Swal from 'sweetalert2';

/* ── Color tokens (reuse from CheckInModal) ── */
const C = {
  PRIMARY:       '#465c47',
  PRIMARY_HOVER: '#384a39',
  SECONDARY:     '#f0f2f0',
  TEXT_DARK:     '#333333',
  TEXT_LIGHT:    '#ffffff',
  ERROR:         '#dc3545',
  BORDER:        '#dde3dd',
  SURFACE:       '#ffffff',
  MUTED:         '#7a8a7b',
  AMBER:         '#f59e0b',
  AMBER_BG:      '#fffbeb',
  AMBER_DARK:    '#92400e',
};

const radius = { sm: '8px', md: '12px', lg: '16px' };
const font = "'DM Sans', sans-serif";

export default function CollectRemainingModal({ show, onClose, booking, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !booking) return null;

  const totalAmount  = Number(booking.totalAmount || 0);
  const prepaidAmount = Number(booking.prepaidAmount || 0);
  // If it's a debt row, use roomDebtAmount directly; otherwise calculate from prepaidAmount
  const amountDue    = booking.roomDebtAmount != null 
    ? Number(booking.roomDebtAmount) 
    : Math.max(0, totalAmount - prepaidAmount);

  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Bank Transfer' : 'Cash';

  const handleSubmit = async () => {
    if (amountDue <= 0) {
      Swal.fire('Info', 'No remaining balance to collect.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      await checkInApi.payDepositBalance(booking.id, paymentMethod);
      Swal.fire({
        icon: 'success',
        title: 'Payment Collected!',
        text: `${amountDue.toLocaleString('vi-VN')} ₫ collected via ${methodLabel(paymentMethod)}.`,
        timer: 2500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: err.response?.data?.error || 'An error occurred while processing the payment.',
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
              Collect Remaining Payment
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

          {/* Amount breakdown */}
          <div style={{
            background: C.AMBER_BG, border: `1.5px solid ${C.AMBER}`,
            borderRadius: radius.md, padding: '18px 20px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.AMBER_DARK, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Summary
              </span>
              <span style={{ fontSize: '11px', color: C.AMBER_DARK, fontWeight: 500,
                background: '#fde68a', padding: '2px 8px', borderRadius: '12px' }}>
                Partial Payment
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fde68a' }}>
              <span style={{ fontSize: '13px', color: C.AMBER_DARK, fontWeight: 500 }}>Total Room Charge</span>
              <span style={{ fontSize: '13px', color: C.AMBER_DARK, fontWeight: 600 }}>{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fde68a' }}>
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>Already Paid (Deposit)</span>
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>−{prepaidAmount.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
              <span style={{ fontSize: '14px', color: C.AMBER_DARK, fontWeight: 700 }}>Remaining Balance</span>
              <span style={{ fontSize: '20px', color: C.AMBER_DARK, fontWeight: 800 }}>{amountDue.toLocaleString('vi-VN')} ₫</span>
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
            disabled={isSubmitting || amountDue <= 0}
            style={{
              padding: '10px 22px', borderRadius: radius.sm, border: 'none',
              background: isSubmitting || amountDue <= 0 ? '#b8c4b8' : C.PRIMARY,
              color: C.TEXT_LIGHT, fontSize: '13.5px', fontWeight: 700,
              cursor: isSubmitting || amountDue <= 0 ? 'not-allowed' : 'pointer',
              fontFamily: font,
            }}
          >
            {isSubmitting ? 'Processing...' : `Collect ${amountDue.toLocaleString('vi-VN')} ₫`}
          </button>
        </div>
      </div>
    </div>
  );
}
