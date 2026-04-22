import React from 'react';
import Swal from 'sweetalert2';

const C = {
  PRIMARY:    '#465c47',
  TEXT_DARK:  '#333333',
  TEXT_LIGHT: '#ffffff',
  BORDER:     '#dde3dd',
  SURFACE:    '#ffffff',
  MUTED:      '#7a8a7b',
  AMBER:      '#f59e0b',
  AMBER_BG:   '#fffbeb',
  AMBER_DARK: '#92400e',
  DANGER:     '#dc3545',
};

const radius = { sm: '8px', md: '12px', lg: '16px' };
const font = "'DM Sans', sans-serif";

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({ icon: 'success', title: 'Copied!', text: text, timer: 1200, showConfirmButton: false });
  }).catch(() => {
    Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not copy to clipboard', timer: 1500, showConfirmButton: false });
  });
}

function ContactRow({ label, name, phone, email, roomName }) {
  return (
    <div style={{
      background: '#f8f9fa', borderRadius: radius.sm,
      padding: '12px 14px', marginBottom: '8px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: C.MUTED, letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
        {roomName && <span style={{ marginLeft: 6, color: '#1565c0', fontWeight: 600 }}>· Room {roomName}</span>}
      </div>
      <div style={{ fontWeight: 700, fontSize: '13.5px', color: C.TEXT_DARK, marginBottom: '6px' }}>
        {name || 'N/A'}
      </div>

      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', color: C.TEXT_DARK }}>📱 {phone}</span>
          <button
            onClick={() => copyToClipboard(phone)}
            style={{
              padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.BORDER}`,
              background: C.SURFACE, cursor: 'pointer', fontSize: '11px', fontWeight: 600,
              color: C.MUTED, fontFamily: font,
            }}
          >📋 Copy</button>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            style={{
              padding: '2px 8px', borderRadius: '4px', border: '1px solid #2e7d32',
              background: '#e8f5e9', textDecoration: 'none', fontSize: '11px', fontWeight: 600,
              color: '#2e7d32', fontFamily: font,
            }}
          >📞 Call</a>
        </div>
      )}

      {email && (
        <div style={{ fontSize: '12px', color: C.MUTED }}>
          ✉️ {email}
        </div>
      )}

      {!phone && !email && (
        <div style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>No contact info available</div>
      )}
    </div>
  );
}

export default function DebtContactModal({ show, onClose, booking }) {
  if (!show || !booking) return null;

  const debt = Number(booking.roomDebtAmount || 0);
  const contacts = booking.debtContacts || [];

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
              💰 Outstanding Debt
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
        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* Debt summary */}
          <div style={{
            background: '#ffebee', border: '1.5px solid #ef9a9a',
            borderRadius: radius.md, padding: '14px 16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: C.DANGER, letterSpacing: '0.5px' }}>
                Room Balance Debt
              </div>
              {booking.actualCheckOutDate && (
                <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px' }}>
                  Checked out: {booking.actualCheckOutDate}
                </div>
              )}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: C.DANGER }}>
              {debt.toLocaleString('vi-VN')} ₫
            </div>
          </div>

          {/* Contact section */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
              color: C.MUTED, letterSpacing: '0.5px', marginBottom: '10px',
            }}>
              📞 Contact to Collect Payment
            </div>

            {/* Booker */}
            <ContactRow
              label="👤 Booker (người đặt)"
              name={booking.guestName}
              phone={booking.bookerPhone}
              email={booking.bookerEmail}
            />

            {/* Stay guests */}
            {contacts.map((c, idx) => (
              <ContactRow
                key={idx}
                label={`🛏 Guest ${idx + 1}`}
                name={c.guestName}
                phone={c.phone}
                email={c.email}
                roomName={c.roomName}
              />
            ))}

            {contacts.length === 0 && !booking.bookerPhone && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontSize: '12.5px' }}>
                No contact information available for this booking.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${C.BORDER}`,
          display: 'flex', justifyContent: 'flex-end',
          background: C.SURFACE,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: radius.sm,
              border: `1.5px solid ${C.BORDER}`, background: C.SURFACE,
              color: C.TEXT_DARK, fontSize: '13.5px', fontWeight: 600,
              cursor: 'pointer', fontFamily: font,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
