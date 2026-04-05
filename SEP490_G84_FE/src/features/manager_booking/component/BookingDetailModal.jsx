import React, { useState } from 'react';
import { checkInApi } from '../api/checkInApi';

const PRIMARY = '#465c47';
const SECONDARY = '#f0f2f0';
const ERROR = '#dc3545';

// Identity number is already masked by the backend (only last 4 digits sent)

function statusBadge(status) {
  const map = {
    CHECKED_IN: { bg: '#e8f2e9', color: PRIMARY, label: 'CHECKED IN' },
    ARRIVED: { bg: '#e3f2fd', color: '#1565c0', label: 'ARRIVED' },
    CONFIRMED: { bg: '#fff3e0', color: '#e65100', label: 'CONFIRMED' },
  };
  return map[status] || { bg: SECONDARY, color: '#666', label: status };
}

// ── Shared row ─────────────────────────────────────────────────────────────────
function Row({ label, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #f0f0f0',
    }}>
      <span style={{ fontSize: '0.85rem', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#222', textAlign: 'right' }}>
        {children}
      </span>
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────
function Section({ title }) {
  return (
    <div style={{
      fontSize: '0.72rem', fontWeight: 800, color: PRIMARY,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '18px 0 6px',
    }}>
      {title}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BookingDetailModal({ show, onClose, booking, onRefresh }) {
  const [editForms, setEditForms] = useState({});
  const [savingId, setSavingId] = useState(null);

  if (!show || !booking) return null;

  const badge = statusBadge(booking.status);

  const startEdit = (stay) =>
    setEditForms(prev => ({
      ...prev,
      [stay.guestId]: {
        guestName: stay.guestName || '',
        identityNumber: stay.identityNumber || '',
        phone: stay.phone || '',
        email: stay.email || '',
        dateOfBirth: stay.dateOfBirth || '',
        nationality: stay.nationality || '',
        gender: stay.gender || '',
      },
    }));

  const cancelEdit = (id) =>
    setEditForms(prev => { const n = { ...prev }; delete n[id]; return n; });

  const onChange = (id, field, val) =>
    setEditForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const handleSave = async (guestId) => {
    const form = editForms[guestId];
    if (!form?.guestName) { alert('Guest name is required.'); return; }
    setSavingId(guestId);
    try {
      await checkInApi.updateGuestInfo(guestId, {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        identityNumber: form.identityNumber || null,
      });
      cancelEdit(guestId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: '#fff', zIndex: 1050,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{ background: PRIMARY, padding: '24px 24px 20px', position: 'relative' }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Booking Details
          </div>

          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginBottom: 10 }}>
            {booking.bookingCode}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: badge.bg, color: badge.color,
              fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, letterSpacing: '0.06em',
            }}>
              {badge.label}
            </span>
            {booking.source && (
              <span style={{
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
                fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              }}>
                {booking.source}
              </span>
            )}
          </div>

        </div>


        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* BOOKING INFO */}
          <Section title="Booking Info" />

          <Row label="Booker">{booking.guestName || '–'}</Row>
          <Row label="Check-in">{booking.checkIn || '–'}</Row>
          <Row label="Check-out">{booking.checkOut || '–'}</Row>
          <Row label="Duration">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</Row>
          <Row label="Total Amount">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {booking.totalAmount?.toLocaleString('vi-VN')} ₫
            </span>
            {' '}
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
              background: booking.paymentStatus === 'PAID' ? '#e8f2e9' : '#ffebee',
              color: booking.paymentStatus === 'PAID' ? PRIMARY : ERROR,
              marginLeft: 4,
            }}>
              {booking.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
            </span>
          </Row>

          {/* LUGGAGE */}
          {(booking.status === 'ARRIVED' || booking.status === 'CHECKED_IN') && (
            <>
              <Section title="Luggage" />
              <Row label="Note">
                {booking.luggageNote
                  || <span style={{ color: '#bbb', fontStyle: 'italic', fontWeight: 400 }}>No luggage deposited</span>}
              </Row>
            </>
          )}

          {/* RESERVED ROOMS — CONFIRMED / ARRIVED */}
          {(booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') && booking.roomDetails?.length > 0 && (
            <>
              <Section title="Reserved Rooms" />
              {booking.roomDetails.map((rd, i) => (
                <Row key={i} label={`Room type ${i + 1}`}>
                  {rd.quantity}× {rd.roomTypeName}
                </Row>
              ))}
            </>
          )}

          {/* IN-HOUSE GUESTS — CHECKED_IN */}
          {booking.status === 'CHECKED_IN' && booking.stayDetails?.length > 0 && (
            <>
              <Section title="In-House Guests" />
              {booking.stayDetails.map((stay, idx) => {
                const form = editForms[stay.guestId];
                const isEdit = !!form;
                const isSaving = savingId === stay.guestId;

                return (
                  <div key={idx}>
                    {/* Guest room label as divider */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 0 4px',
                      borderBottom: `2px solid ${PRIMARY}22`,
                      marginBottom: 0,
                    }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: PRIMARY }}>Room {stay.roomName}</span>
                      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{stay.roomTypeName}</span>
                    </div>

                    {/* Rows or edit form */}
                    <div>
                      {isEdit ? (
                        /* Edit form */
                        <div style={{ padding: '12px 0' }}>
                          {[
                            { label: 'Full Name', field: 'guestName', type: 'text' },
                            { label: 'Phone', field: 'phone', type: 'text' },
                            { label: 'Email', field: 'email', type: 'email' },
                            { label: 'Date of Birth', field: 'dateOfBirth', type: 'date' },
                            { label: 'Nationality', field: 'nationality', type: 'text' },
                          ].map(({ label, field, type }) => (
                            <div key={field} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>
                                {label}
                              </div>
                              <input
                                type={type}
                                className="form-control form-control-sm"
                                value={form[field]}
                                onChange={e => onChange(stay.guestId, field, e.target.value)}
                              />
                            </div>
                          ))}

                          {/* ID — disabled */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>
                              CCCD / Passport
                            </div>
                            <input className="form-control form-control-sm"
                              value={form.identityNumber} disabled
                              style={{ background: SECONDARY, color: '#aaa' }} />
                          </div>

                          {/* Gender */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>
                              Gender
                            </div>
                            <select className="form-select form-select-sm" value={form.gender}
                              onChange={e => onChange(stay.guestId, 'gender', e.target.value)}>
                              <option value="">--</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button className="btn btn-sm btn-outline-secondary px-3"
                              onClick={() => cancelEdit(stay.guestId)} disabled={isSaving}>
                              Cancel
                            </button>
                            <button className="btn btn-sm px-4"
                              style={{ background: PRIMARY, color: '#fff', border: 'none' }}
                              onClick={() => handleSave(stay.guestId)} disabled={isSaving}>
                              {isSaving ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View mode rows */
                        <>
                          <Row label="Full Name">{stay.guestName || '–'}</Row>
                          <Row label="CCCD / Passport">
                            <span style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                              {stay.identityNumber || '–'}
                            </span>
                          </Row>
                          <Row label="Phone">{stay.phone || '–'}</Row>
                          <Row label="Email">{stay.email || '–'}</Row>
                          <Row label="Date of Birth">{stay.dateOfBirth || '–'}</Row>
                          <Row label="Gender">{stay.gender || '–'}</Row>
                          <Row label="Nationality">{stay.nationality || '–'}</Row>
                          <Row label="Checked in by">
                            <span style={{ color: '#888', fontWeight: 400 }}>{stay.checkInBy} · {stay.actualCheckInTime}</span>
                          </Row>

                          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm px-3"
                              style={{ border: `1px solid ${PRIMARY}`, color: PRIMARY, background: 'transparent', fontWeight: 600 }}
                              onClick={() => startEdit(stay)}>
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}