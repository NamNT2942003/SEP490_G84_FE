import React from 'react';
import { checkInApi } from '../api/checkInApi';
import Swal from 'sweetalert2';

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

function isInternalFrontendBooking(source) {
  return (source || '').trim().toUpperCase() === 'FRONT_END';
}

function statusBadge(booking, isNoShow, isCheckinDay, isCheckoutOverdue, isCheckoutToday) {
  if (booking.status === 'NO_SHOW') return { text: 'No-Show', bg: '#212121', color: '#fff' };
  if (isNoShow) return { text: '⚠ Overdue / No-Show', bg: '#ffcdd2', color: '#b71c1c' };
  if (isCheckinDay) return { text: '📋 Check-in Today', bg: '#fff3e0', color: '#e65100' };
  if (isCheckoutOverdue) return { text: '⚠ Overstayed', bg: '#ffcdd2', color: '#b71c1c' };
  if (isCheckoutToday) return { text: '⏰ Checkout Due Today', bg: '#fff3e0', color: '#e65100' };
  if (booking.status === 'ARRIVED') return { text: '🧳 Arrived · Luggage Stored', bg: '#e1f5fe', color: '#01579b' };
  if (booking.status === 'CONFIRMED') return { text: 'Awaiting Check-in', bg: '#e8f5e9', color: '#2e7d32' };
  if (booking.status === 'CHECKED_IN') return { text: 'In-House', bg: '#fce4ec', color: '#880e4f' };
  return { text: booking.status, bg: '#eee', color: '#555' };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingTable({
  bookings,
  emptyMessage,
  onCheckInClick,
  onDetailsClick,
  onCheckoutClick,
  onLateCheckoutClick,
  onCollectRemainingClick,
  onDebtDetailClick,
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
    if (!isInternalFrontendBooking(booking.source)) {
      await Swal.fire('Not allowed', 'Only internal FRONT_END bookings can be undone.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Undo Check-in?',
      html: `⚠️ Undo check-in for booking <b>${booking.bookingCode}</b>?<br><br>All check-in data and surcharges will be permanently deleted!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, undo it!'
    });

    if (result.isConfirmed) {
      try {
        await checkInApi.undoCheckIn(booking.id);
        Swal.fire('Success', 'Check-in undone successfully.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to undo check-in.', 'error');
      }
    }
  };

  const handleNotifyNoShow = async (booking) => {
    const result = await Swal.fire({
      title: 'Send reminder?',
      text: `Send no-show reminder email for booking ${booking.bookingCode}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Send'
    });

    if (result.isConfirmed) {
      try {
        await checkInApi.notifyNoShow(booking.id);
        Swal.fire('Sent!', 'Reminder email sent successfully!', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to send email.', 'error');
      }
    }
  };

  const handleMarkNoShow = async (booking) => {
    const result = await Swal.fire({
      title: 'Mark as No-Show?',
      html: `Mark booking <b>${booking.bookingCode}</b> as NO_SHOW?<br><br>This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, mark it'
    });

    if (result.isConfirmed) {
      try {
        await checkInApi.markNoShow(booking.id);
        Swal.fire('Marked', 'Booking marked as No-Show.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to mark as No-Show.', 'error');
      }
    }
  };

  const handleRemindCheckout = async (booking) => {
    const result = await Swal.fire({
      title: 'Send checkout reminder?',
      text: `Send checkout reminder email to ${booking.guestName} for booking ${booking.bookingCode}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Send'
    });

    if (result.isConfirmed) {
      try {
        await checkInApi.notifyCheckout(booking.id);
        Swal.fire('Sent!', 'Checkout reminder email sent!', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to send email.', 'error');
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
          {bookings.map((booking, idx) => {
            // ── Debt row divider ──
            const isFirstDebt = booking._isDebt && (idx === 0 || !bookings[idx - 1]._isDebt);

            // ── Debt row shortcut ──
            if (booking._isDebt) {
              const src = sourceTag(booking.source);
              return (
                <React.Fragment key={`debt-${booking.id}`}>
                  {isFirstDebt && (
                    <tr>
                      <td colSpan={7} style={{
                        background: '#fff8e1', padding: '8px 14px', fontSize: '0.76rem',
                        color: '#e65100', fontWeight: 700, borderTop: '2px solid #ffe082',
                      }}>
                        💰 Outstanding Debts — Checked Out with Unpaid Room Balance
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: '#fffbeb', borderBottom: '1px solid #f0f0f0' }}>
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
                      <div className="d-flex flex-wrap gap-1">
                        {booking.assignedRooms?.map((r, i) => (
                          <span key={i} className="badge"
                            style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.77rem' }}>
                            Room {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Stay period */}
                    <td>
                      <div className="fw-medium small">{booking.checkIn} → {booking.checkOut}</div>
                      <div className="small text-muted">({booking.nights} night{booking.nights !== 1 ? 's' : ''})</div>
                      {booking.actualCheckOutDate && (
                        <div className="mt-1">
                          <span className="px-2 py-1 rounded-2 fw-bold"
                            style={{ background: '#f5f5f5', color: '#666', fontSize: '0.71rem' }}>
                            <i className="bi bi-box-arrow-right me-1"></i>Out: {booking.actualCheckOutDate}
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Amount — show debt */}
                    <td>
                      <div className="fw-bold small text-muted">{booking.totalAmount?.toLocaleString('en-US')} VND</div>
                      <span className="px-2 py-1 rounded-2 fw-bold mt-1 d-inline-block"
                        style={{ fontSize: '0.71rem', background: '#ffebee', color: '#c62828' }}>
                        ⚠ Debt: {Number(booking.roomDebtAmount || 0).toLocaleString('en-US')} VND
                      </span>
                    </td>
                    {/* Status */}
                    <td>
                      <span className="px-2 py-1 rounded-2 fw-bold d-inline-block"
                        style={{ background: '#fff3e0', color: '#e65100', fontSize: '0.77rem' }}>
                        💰 Checked Out · Debt
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="text-end pe-3">
                      <div className="d-flex justify-content-end align-items-center gap-1">
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #f59e0b', fontSize: '0.79rem' }}
                          onClick={() => onCollectRemainingClick && onCollectRemainingClick(booking)}>
                          <i className="bi bi-cash-coin me-1"></i>Collect
                        </button>
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', fontSize: '0.79rem' }}
                          onClick={() => onDebtDetailClick && onDebtDetailClick(booking)}>
                          <i className="bi bi-telephone-fill me-1"></i>Contact
                        </button>
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
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            }

            // ── Normal row (CHECKED_IN / CONFIRMED / ARRIVED) ──
            const t = today();
            let isNoShow = false, isCheckinDay = false, isCheckoutOverdue = false, isCheckoutToday = false;

            const checkInDate = parseDate(booking.checkIn);
            const checkOutDate = parseDate(booking.checkOut);

            if (booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') {
              if (checkInDate && checkInDate < t) isNoShow = true;           // past check-in day → No-Show eligible
              if (checkInDate && checkInDate.getTime() === t.getTime()) isCheckinDay = true; // check-in day → Notify only
            } else if (booking.status === 'CHECKED_IN') {
              if (checkOutDate) {
                if (checkOutDate.getTime() === t.getTime()) isCheckoutToday = true;
                else if (checkOutDate < t) isCheckoutOverdue = true;
              }
            }

            let rowBg = 'transparent';
            if (isNoShow || isCheckoutOverdue) rowBg = '#fff8f8';
            else if (isCheckinDay) rowBg = '#fffde7';
            else if (isCheckoutToday) rowBg = '#fffde7';

            const src = sourceTag(booking.source);
            const badge = dateBadge(pivotStr(booking));
            const sbadge = statusBadge(booking, isNoShow, isCheckinDay, isCheckoutOverdue, isCheckoutToday);

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
                  {(() => {
                    // OTA: platform already collected — no breakdown needed
                    if (!isInternalFrontendBooking(booking.source)) return null;
                    const paid  = Number(booking.prepaidAmount ?? 0);
                    const roomAmt = Number(booking.roomAmount ?? booking.totalAmount ?? 0);
                    const roomDue = Math.max(0, roomAmt - paid);
                    // Only show breakdown when there's a partial payment
                    if (paid <= 0) return null;
                    // Room fully paid — no breakdown needed
                    if (roomDue <= 0) return null;
                    return (
                      <div className="d-flex flex-column gap-1 mt-1">
                        <span className="px-2 py-1 rounded-2 fw-bold"
                          style={{ fontSize: '0.71rem', background: '#e8f5e9', color: '#2e7d32' }}>
                          ✓ {paid.toLocaleString('en-US')}
                        </span>
                        <span className="px-2 py-1 rounded-2 fw-bold"
                          style={{ fontSize: '0.71rem', background: '#fff3e0', color: '#e65100' }}>
                          - Due: {roomDue.toLocaleString('en-US')}
                        </span>
                      </div>
                    );
                  })()}
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
                  <div className="d-flex justify-content-end align-items-center gap-1 flex-wrap">

                    {/* Check-in day: Notify only (guest expected today) */}
                    {isCheckinDay && booking.status !== 'NO_SHOW' && (
                      <button className="btn btn-sm fw-semibold"
                        style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', fontSize: '0.79rem' }}
                        onClick={() => handleNotifyNoShow(booking)}>
                        <i className="bi bi-envelope-fill me-1"></i>Notify
                      </button>
                    )}

                    {/* Overdue no-show: past check-in day → Notify + No-Show */}
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

                    {/* Check-in button: available on check-in day and before */}
                    {!isNoShow && booking.status !== 'NO_SHOW'
                      && (booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') && (
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: accent, color: '#fff', border: 'none', fontSize: '0.82rem' }}
                          onClick={() => onCheckInClick(booking)}>
                          <i className="bi bi-box-arrow-in-right me-1"></i>Check In
                        </button>
                      )}

                    {/* Collect Remaining — only when ROOM charges not fully paid */}
                    {(() => {
                      const paid = Number(booking.prepaidAmount ?? 0);
                      const roomAmt = Number(booking.roomAmount ?? booking.totalAmount ?? 0);
                      return paid > 0 && paid < roomAmt && booking.status !== 'NO_SHOW';
                    })() && (
                        <button className="btn btn-sm fw-semibold"
                          style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #f59e0b', fontSize: '0.79rem' }}
                          onClick={() => onCollectRemainingClick && onCollectRemainingClick(booking)}>
                          <i className="bi bi-cash-coin me-1"></i>Collect Remaining
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
                        <button className="btn btn-sm fw-semibold px-2"
                          style={{ background: '#6c757d', color: '#fff', border: 'none', fontSize: '0.82rem' }}
                          onClick={() => onLateCheckoutClick && onLateCheckoutClick(booking)}
                          title="Request Late Check-out">
                          <i className="bi bi-clock-history"></i>
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
                        {booking.status === 'CHECKED_IN' && isInternalFrontendBooking(booking.source) && (
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