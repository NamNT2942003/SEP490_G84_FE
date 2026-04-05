import React from 'react';
import { checkInApi } from '../api/checkInApi';

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Visual date label */
function dateBadge(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const t = today();
  const diff = Math.round((d - t) / 86400000);
  if (diff < 0) return { text: `Overdue by ${Math.abs(diff)}d`, bg: '#ffebee', color: '#c62828', icon: 'bi-exclamation-circle-fill' };
  if (diff === 0) return { text: 'Today', bg: '#e8f5e9', color: '#2e7d32', icon: 'bi-calendar-check-fill' };
  if (diff === 1) return { text: 'Tomorrow', bg: '#e3f2fd', color: '#1565c0', icon: 'bi-calendar2-event-fill' };
  return { text: `In ${diff} days`, bg: '#f5f5f5', color: '#666', icon: 'bi-calendar3' };
}

function sourceTag(source) {
  if (!source) return { label: 'Unknown', bg: '#eeeeee', color: '#666' };
  const s = source.toLowerCase();
  if (s.includes('booking.com') || s.includes('ota')) return { label: 'Booking.com', bg: '#003580', color: '#fff' };
  if (s.includes('agoda')) return { label: 'Agoda', bg: '#e31837', color: '#fff' };
  if (s.includes('direct') || s.includes('internal') || s.includes('nội bộ'))
    return { label: 'Direct', bg: '#e8f5e9', color: '#2e7d32' };
  return { label: source, bg: '#eeeeee', color: '#444' };
}

function statusBadge(booking, isNoShow, isCheckoutOverdue, isCheckoutToday) {
  if (booking.status === 'NO_SHOW')   return { text: 'No-Show', bg: '#212121', color: '#fff' };
  if (isNoShow)                       return { text: '⚠ Overdue / No-Show', bg: '#ffcdd2', color: '#b71c1c' };
  if (isCheckoutOverdue)              return { text: '⚠ Overstayed', bg: '#ffcdd2', color: '#b71c1c' };
  if (isCheckoutToday)                return { text: '⏰ Checkout Due Today', bg: '#fff3e0', color: '#e65100' };
  if (booking.status === 'ARRIVED')   return { text: '🧳 Arrived · Luggage Stored', bg: '#e1f5fe', color: '#01579b' };
  if (booking.status === 'CONFIRMED') return { text: 'Awaiting Check-in', bg: '#e8f5e9', color: '#2e7d32' };
  if (booking.status === 'CHECKED_IN')return { text: 'In-House', bg: '#fce4ec', color: '#880e4f' };
  return { text: booking.status, bg: '#eee', color: '#555' };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingTable({
  bookings,
  emptyMessage,
  onCheckInClick,
  onDetailsClick,
  onCheckoutClick,
  onRefresh,
  mode = 'checkin',
  accent = '#2e7d32',
}) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
        {emptyMessage || 'No bookings found.'}
      </div>
    );
  }

  const handleUndoCheckIn = async (booking) => {
    if (window.confirm(`⚠️ Undo check-in for booking ${booking.bookingCode}?\n\nAll check-in data and surcharges will be permanently deleted!`)) {
      try {
        await checkInApi.undoCheckIn(booking.id);
        alert('Check-in undone successfully.');
        if (onRefresh) onRefresh();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to undo check-in.');
      }
    }
  };

  const handleNotifyNoShow = async (booking) => {
    if (window.confirm(`Send no-show reminder email for booking ${booking.bookingCode}?`)) {
      try {
        await checkInApi.notifyNoShow(booking.id);
        alert('Reminder email sent successfully!');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to send email.');
      }
    }
  };

  const handleMarkNoShow = async (booking) => {
    if (window.confirm(`Mark booking ${booking.bookingCode} as NO_SHOW?\n\nThis cannot be undone.`)) {
      try {
        await checkInApi.markNoShow(booking.id);
        alert('Booking marked as No-Show.');
        if (onRefresh) onRefresh();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to mark as No-Show.');
      }
    }
  };

  const handleRemindCheckout = async (booking) => {
    if (window.confirm(`Send checkout reminder email to ${booking.guestName} for booking ${booking.bookingCode}?`)) {
      try {
        await checkInApi.notifyCheckout(booking.id);
        alert('Checkout reminder email sent!');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to send email.');
      }
    }
  };

  const pivotStr = (b) => mode === 'checkin' ? b.checkIn : b.checkOut;

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.87rem' }}>
        <thead style={{ background: '#fafafa', fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em' }}>
          <tr>
            <th className="py-3 px-3">Guest &amp; Booking Code</th>
            <th className="py-3">Source</th>
            <th className="py-3">Room(s)</th>
            <th className="py-3">Stay Period</th>
            <th className="py-3">Amount</th>
            <th className="py-3">Status</th>
            <th className="py-3 text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const t = today();
            let isNoShow = false, isCheckoutOverdue = false, isCheckoutToday = false;

            const checkInDate = parseDate(booking.checkIn);
            const checkOutDate = parseDate(booking.checkOut);

            if (booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') {
              if (checkInDate && checkInDate < t) isNoShow = true;
            } else if (booking.status === 'CHECKED_IN') {
              if (checkOutDate) {
                if (checkOutDate.getTime() === t.getTime()) isCheckoutToday = true;
                else if (checkOutDate < t) isCheckoutOverdue = true;
              }
            }

            let rowBg = 'transparent';
            if (isNoShow || isCheckoutOverdue) rowBg = '#fff8f8';
            else if (isCheckoutToday) rowBg = '#fffde7';

            const src = sourceTag(booking.source);
            const badge = dateBadge(pivotStr(booking));
            const sbadge = statusBadge(booking, isNoShow, isCheckoutOverdue, isCheckoutToday);

            return (
              <tr key={booking.id} style={{ background: rowBg, borderBottom: '1px solid #f0f0f0' }}>

                {/* Guest & Code */}
                <td className="px-3 py-3">
                  <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{booking.guestName}</div>
                  <div className="text-muted" style={{ fontSize: '0.76rem', fontFamily: 'monospace' }}>{booking.bookingCode}</div>
                </td>

                {/* Source */}
                <td>
                  <span className="px-2 py-1 rounded-2 fw-bold"
                    style={{ background: src.bg, color: src.color, fontSize: '0.74rem' }}>
                    {src.label}
                  </span>
                </td>

                {/* Room(s) */}
                <td>
                  {booking.status === 'CONFIRMED' || booking.status === 'ARRIVED' ? (
                    <div>
                      {booking.roomDetails?.map((rd, i) => (
                        <div key={i} className="small">
                          <span className="fw-semibold">{rd.quantity}x</span> {rd.roomTypeName}
                        </div>
                      ))}
                      {booking.status === 'ARRIVED' && booking.luggageNote && (
                        <div className="small text-info mt-1">
                          <i className="bi bi-bag-fill me-1"></i>{booking.luggageNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {booking.assignedRooms?.map((r, i) => (
                        <span key={i} className="badge"
                          style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.77rem' }}>
                          Room {r}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Stay period */}
                <td>
                  <div className="fw-medium small">{booking.checkIn} → {booking.checkOut}</div>
                  <div className="small text-muted">({booking.nights} night{booking.nights !== 1 ? 's' : ''})</div>
                  {badge && (
                    <div className="mt-1">
                      <span className="px-2 py-1 rounded-2 fw-bold"
                        style={{ background: badge.bg, color: badge.color, fontSize: '0.71rem' }}>
                        <i className={`bi ${badge.icon} me-1`}></i>{badge.text}
                      </span>
                    </div>
                  )}
                </td>

                {/* Amount */}
                <td>
                  <div className="fw-bold small">{booking.totalAmount?.toLocaleString('en-US')} VND</div>
                  <span className="px-2 py-1 rounded-2 fw-bold" style={{
                    fontSize: '0.71rem',
                    background: booking.paymentStatus === 'PAID' ? '#e8f5e9' : '#fff3e0',
                    color: booking.paymentStatus === 'PAID' ? '#2e7d32' : '#e65100',
                  }}>
                    {booking.paymentStatus === 'PAID' ? '✓ Paid' : '· Unpaid'}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className="px-2 py-1 rounded-2 fw-bold d-inline-block"
                    style={{ background: sbadge.bg, color: sbadge.color, fontSize: '0.77rem', maxWidth: 190 }}>
                    {sbadge.text}
                  </span>
                </td>

                {/* Actions */}
                <td className="text-end pe-3">
                  <div className="d-flex justify-content-end align-items-center gap-1">

                    {/* Overdue no-show */}
                    {isNoShow && booking.status !== 'NO_SHOW' && (
                      <>
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', fontSize: '0.79rem' }}
                          onClick={() => handleNotifyNoShow(booking)}>
                          <i className="bi bi-envelope-fill me-1"></i>Notify
                        </button>
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#212121', color: '#fff', border: 'none', fontSize: '0.79rem' }}
                          onClick={() => handleMarkNoShow(booking)}>
                          <i className="bi bi-person-slash me-1"></i>No-Show
                        </button>
                      </>
                    )}

                    {/* Check-in button */}
                    {!isNoShow && booking.status !== 'NO_SHOW'
                      && (booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') && (
                      <button className="btn btn-sm fw-semibold"
                        style={{ background: accent, color: '#fff', border: 'none', fontSize: '0.82rem' }}
                        onClick={() => onCheckInClick(booking)}>
                        <i className="bi bi-box-arrow-in-right me-1"></i>Check In
                      </button>
                    )}

                    {/* Check-out mode */}
                    {booking.status === 'CHECKED_IN' && (
                      <>
                        {isCheckoutToday && (
                          <button className="btn btn-sm fw-semibold"
                            style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', fontSize: '0.79rem' }}
                            onClick={() => handleRemindCheckout(booking)}>
                            <i className="bi bi-bell-fill me-1"></i>Remind
                          </button>
                        )}
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#c62828', color: '#fff', border: 'none', fontSize: '0.82rem' }}
                          onClick={() => onCheckoutClick(booking)}>
                          <i className="bi bi-box-arrow-right me-1"></i>Check Out
                        </button>
                      </>
                    )}

                    {/* 3-dot menu */}
                    <div className="dropdown">
                      <button className="btn btn-sm btn-light border-0 text-secondary"
                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-1" style={{ fontSize: '0.88rem' }}>
                        <li>
                          <button className="dropdown-item py-2 d-flex align-items-center"
                            onClick={() => onDetailsClick(booking)}>
                            <i className="bi bi-info-circle text-primary me-3 fs-6"></i>View Details
                          </button>
                        </li>
                        {booking.status === 'CHECKED_IN' && (
                          <>
                            <li><hr className="dropdown-divider my-1" /></li>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center text-danger"
                                onClick={() => handleUndoCheckIn(booking)}>
                                <i className="bi bi-arrow-counterclockwise me-3 fs-6"></i>Undo Check-in
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}