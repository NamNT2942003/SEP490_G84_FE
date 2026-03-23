import React from 'react';
import { checkInApi } from '../api/checkInApi';

export default function BookingTable({ bookings, emptyMessage, onCheckInClick, onDetailsClick, onCheckoutClick, onRefresh }) {
  
  if (!bookings || bookings.length === 0) {
    return <div className="text-center p-5 text-muted bg-white rounded shadow-sm mt-3">{emptyMessage || 'No bookings found.'}</div>;
  }

  const handleUndoCheckIn = async (booking) => {
    const confirmMessage = `⚠️ WARNING: Are you sure you want to UNDO the check-in for booking ${booking.bookingCode}?\n\nAll check-in data and surcharges (if any) will be permanently deleted!`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await checkInApi.undoCheckIn(booking.id);
        alert("Check-in undone successfully. Booking status has been restored!");
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } catch (error) {
        console.error("Undo Check-in Error:", error);
        alert(error.response?.data?.error || "An error occurred while undoing the check-in!");
      }
    }
  };

  return (
    <div className="table-responsive" style={{ minHeight: '350px' }}>
      
      {/* NHÚNG CSS MÀU THƯƠNG HIỆU VÀO ĐÂY */}
      <style>
        {`
          .btn-brand-primary {
            background-color: #59755b; /* Màu xanh rêu sáng hơn 1 tone */
            color: #ffffff;
            border: 1px solid #59755b;
            transition: all 0.2s ease-in-out;
          }
          .btn-brand-primary:hover {
            background-color: #465c47; /* Màu gốc của Logo khi hover */
            border-color: #465c47;
            color: #ffffff;
          }
        `}
      </style>

      <table className="table table-hover align-middle bg-white shadow-sm rounded">
        <thead className="table-light text-secondary" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
          <tr>
            <th>Booking Info</th>
            <th>Source</th>
            <th>Room Details</th> 
            <th>Stay Dates</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            let isNoShow = false;
            let isCheckoutOverdue = false;
            let isCheckoutToday = false;

            if (booking.checkOut) {
              const parts = booking.checkOut.split('/');
              if (parts.length === 3) {
                const checkoutDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') {
                  if (checkoutDate < today) isNoShow = true;
                } else if (booking.status === 'CHECKED_IN') {
                  if (checkoutDate.getTime() === today.getTime()) isCheckoutToday = true;
                  else if (checkoutDate < today) isCheckoutOverdue = true;
                }
              }
            }

            let rowClass = "";
            if (isNoShow || isCheckoutOverdue) rowClass = "table-danger";
            else if (isCheckoutToday) rowClass = "table-warning";

            return (
              <tr key={booking.id} className={rowClass}>
              
              <td>
                <div className="fw-bold text-dark">{booking.guestName}</div>
                <div className="small text-muted">{booking.bookingCode}</div>
              </td>
              
              <td>
                <span className={`badge ${booking.source?.toLowerCase().includes('direct') ? 'bg-info text-dark' : 'bg-primary'}`}>
                  {booking.source}
                </span>
              </td>
              
              <td>
                {booking.status === 'PENDING_CHECKIN' || booking.status === 'CONFIRMED' || booking.status === 'ARRIVED' ? (
                  <div>
                    {booking.roomDetails?.map((rd, idx) => (
                      <div key={idx} className="small">
                        <span className="fw-bold">{rd.quantity}x</span> {rd.roomTypeName}
                      </div>
                    ))}
                    {booking.status === 'ARRIVED' && booking.luggageNote && (
                      <div className="small text-info mt-1">
                        <i className="bi bi-luggage me-1"></i>
                        <span className="fw-medium">Luggage:</span> {booking.luggageNote}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {booking.assignedRooms?.map((roomName, idx) => (
                      <span key={idx} className="badge bg-secondary me-1">Room {roomName}</span>
                    ))}
                  </div>
                )}
              </td>
              
              <td>
                <div className="small fw-medium">{booking.checkIn} <i className="bi bi-arrow-right text-muted mx-1"></i> {booking.checkOut}</div>
                <div className="small text-muted">({booking.nights} nights)</div>
              </td>
              
              <td>
                <div className="fw-bold">{booking.totalAmount?.toLocaleString()} VND</div>
                <div className={`small fw-bold ${booking.paymentStatus === 'PAID' ? 'text-success' : 'text-danger'}`}>
                  {booking.paymentStatus === 'PAID' ? 'Fully Paid' : 'Unpaid'}
                </div>
              </td>
              
              <td>
                {isNoShow && (
                  <div className="mb-1">
                    <span className="badge bg-danger">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>Overdue / No-Show
                    </span>
                  </div>
                )}
                {isCheckoutOverdue && (
                  <div className="mb-1">
                    <span className="badge bg-danger shadow-sm border border-danger">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>Overstayed / Needs Checkout
                    </span>
                  </div>
                )}
                {isCheckoutToday && (
                  <div className="mb-1">
                    <span className="badge bg-warning text-dark border border-warning">
                      <i className="bi bi-clock-history me-1"></i>Checkout Due Today
                    </span>
                  </div>
                )}
                {booking.status === 'ARRIVED' && (
                  <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle px-2 py-1">
                    <i className="bi bi-luggage me-1"></i>Arrived - Luggage Stored
                  </span>
                )}
                {booking.status === 'CONFIRMED' && (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-1">Awaiting Check-in</span>
                )}
                {booking.status === 'CHECKED_IN' && (
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2 py-1">Staying</span>
                )}
              </td>

              <td className="text-end">
                <div className="dropdown d-flex justify-content-end align-items-center">
                  
                  {/* NÚT CHECK-IN ĐÃ ĐƯỢC ĐỔI SANG MÀU BRAND */}
                  {(booking.status === 'CONFIRMED' || booking.status === 'ARRIVED') && (
                    <button 
                      className="btn btn-sm btn-brand-primary px-3 shadow-sm me-2 fw-medium" 
                      onClick={() => onCheckInClick(booking)}
                    >
                      <i className="bi bi-box-arrow-in-right me-1"></i> Check In
                    </button>
                  )}
                  
                  {booking.status === 'CHECKED_IN' && (
                    <button 
                      className="btn btn-sm btn-danger px-3 shadow-sm me-2 fw-medium"
                      onClick={() => onCheckoutClick(booking)}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Check Out
                    </button>
                  )}

                  <button 
                    className="btn btn-sm btn-light border-0 text-secondary" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  
                  <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-1" style={{ fontSize: '0.9rem' }}>
                    <li>
                      <button className="dropdown-item py-2 d-flex align-items-center" onClick={() => onDetailsClick(booking)}>
                        <i className="bi bi-info-circle text-primary me-3 fs-6"></i> View Details
                      </button>
                    </li>
                    
                    {booking.status === 'CHECKED_IN' && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button className="dropdown-item py-2 d-flex align-items-center text-danger" onClick={() => handleUndoCheckIn(booking)}>
                            <i className="bi bi-arrow-counterclockwise me-3 fs-6"></i> Undo Check-in
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                  
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