import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './checkout-print.css';
import { checkoutApi } from '../api/checkoutApi';

const BRANCH_CONFIG = {
  1: { name: "AN HOTEL & RESORT - HANOI", address: "123 Trang Tien, Hoan Kiem, Hanoi", phone: "024.1234.5678" },
  2: { name: "AN HOTEL & RESORT - DANANG", address: "456 Vo Nguyen Giap, Son Tra, Danang", phone: "0236.9876.5432" }
};

const PAYMENT_METHODS = [
  { value: 'CASH', icon: 'bi-cash-coin', label: 'Cash' },
  { value: 'TRANSFER', icon: 'bi-bank', label: 'Transfer' },
  { value: 'CARD', icon: 'bi-credit-card-2-front', label: 'Card' },
];

export default function CheckoutModal({ show, onClose, booking, onSuccess, branchId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomBilling, setRoomBilling] = useState(null);
  const [loadingBill, setLoadingBill] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [activeRoomIdx, setActiveRoomIdx] = useState('ALL');

  const currentBranch = BRANCH_CONFIG[branchId] || {
    name: "AN Nguyen HOTEL & RESORT", address: "Ha Noi, Vietnam", phone: "0123.456.789"
  };

  useEffect(() => {
    if (!show || !booking) return;
    setPaymentMethod('');
    setActiveRoomIdx('ALL');
    setLoadingBill(true);
    checkoutApi.getRoomBillingInfo(booking.id)
      .then(data => setRoomBilling(data))
      .catch(err => {
        console.error('Error fetching room billing:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load room billing details. Please try again.' });
      })
      .finally(() => setLoadingBill(false));
  }, [show, booking]);

  if (!show || !booking) return null;

  if (loadingBill || !roomBilling) return (
    <>
      <div className="modal-backdrop fade show no-print" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block no-print" tabIndex="-1" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-5 text-center border-0 shadow-lg">
            <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
            <h5 className="text-secondary">Loading Billing Details...</h5>
          </div>
        </div>
      </div>
    </>
  );

  const rooms = roomBilling.rooms || [];
  const activeRoom = rooms[activeRoomIdx] || null;
  const grandTotal = roomBilling.grandTotal || 0;
  const alreadyPaid = roomBilling.alreadyPaidTotal || 0;
  const amountDue = roomBilling.amountDue || 0;
  const totalRoomCharge = roomBilling.totalRoomCharge || 0;
  const roomChargePaid = roomBilling.roomChargePaid || false;

  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Transfer' : 'Cash';
  const fmtMoney = (v) => Number(v || 0).toLocaleString();

  const handlePrint = () => window.print();

  const handleConfirmCheckout = async () => {
    if (!paymentMethod) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Please select a payment method to continue.' }); return; }
    setIsSubmitting(true);
    try {
      const response = await checkoutApi.processCheckout(booking.id, paymentMethod);
      Swal.fire({ icon: 'success', title: 'Done!', text: response.message || 'Check-out completed successfully!', timer: 2000, showConfirmButton: false });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Checkout Failed', text: error.response?.data?.error || 'An error occurred during check-out. Please try again.' });
    } finally { setIsSubmitting(false); }
  };

  const hasRoomChange = activeRoom?.roomHistory?.length > 1;

  return (
    <>
      <div className="modal-backdrop fade show no-print" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block no-print" tabIndex="-1"
        style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered"
          style={{ maxWidth: 1500, margin: '1.5rem auto', maxHeight: 'calc(100vh - 3rem)', transform: 'translateX(150px)' }}>
          <div className="modal-content border-0 shadow-lg d-flex flex-column"
            style={{ maxHeight: 'calc(100vh - 3rem)', overflow: 'hidden' }}>

            {/* HEADER */}
            <div className="modal-header bg-dark text-white border-0 py-2 px-4" style={{ flexShrink: 0 }}>
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.05rem' }}>
                  <i className="bi bi-receipt me-2"></i>Checkout & Billing
                </h5>
                <small className="text-secondary" style={{ fontSize: '0.78rem' }}>
                  {booking.bookingCode} · {booking.guestName}
                </small>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
            </div>

            {/* BODY — scrollable */}
            <div className="modal-body p-0" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
              <div className="row g-0" style={{ minHeight: '100%' }}>

                {/* ═══ CỘT TRÁI: BILL CHI TIẾT ═══ */}
                <div className="col-lg-8 p-3" style={{ backgroundColor: '#f8f9fa' }}>

                  {/* Room Tabs */}
                  {rooms.length > 1 && (
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      <button
                        className={`btn btn-sm fw-semibold px-3 py-1 ${activeRoomIdx === 'ALL' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveRoomIdx('ALL')}
                        style={{ borderRadius: 8, fontSize: '0.8rem' }}>
                        <i className="bi bi-list-columns-reverse me-1"></i>
                        All Rooms
                      </button>
                      {rooms.map((room, idx) => (
                        <button key={idx}
                          className={`btn btn-sm fw-semibold px-3 py-1 ${activeRoomIdx === idx ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                          onClick={() => setActiveRoomIdx(idx)}
                          style={{ borderRadius: 8, fontSize: '0.8rem' }}>
                          <i className="bi bi-door-open me-1"></i>
                          {room.roomName}
                          <span className="ms-1 opacity-75">· {room.guestName?.split(' ').pop()}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active room card(s) */}
                  {(activeRoomIdx === 'ALL' ? rooms : (activeRoom ? [activeRoom] : [])).map((room, renderIdx) => {
                    const isRoomChange = room.roomHistory?.length > 1;
                    return (
                      <div key={renderIdx} className="card border-0 shadow-sm mb-3">
                        {/* Room info */}
                        <div className="card-header bg-white py-2 px-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                                <i className="bi bi-door-open me-1 text-primary"></i>
                                {room.roomName}
                              </span>
                              <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>
                                {room.roomTypeName}
                              </span>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                  <i className="bi bi-person me-1"></i>{room.guestName}
                                </small>
                                {isRoomChange && (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.68rem' }}>
                                    <i className="bi bi-arrow-left-right me-1"></i>
                                    {room.roomHistory.join(' → ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Room Price</div>
                              <div className="fw-bold">{fmtMoney(room.roomPrice)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Services table */}
                        <div className="table-responsive">
                          <table className="table table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead className="table-light text-muted">
                              <tr>
                                <th style={{ minWidth: 160 }}>Service</th>
                                <th className="text-center" style={{ width: 45 }}>Qty</th>
                                <th className="text-center" style={{ width: 65 }}>Status</th>
                                {isRoomChange && <th className="text-center" style={{ width: 55 }}>Room</th>}
                                <th className="text-end" style={{ width: 100 }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(!room.services || room.services.length === 0) ? (
                                <tr>
                                  <td colSpan={isRoomChange ? 5 : 4} className="text-center text-muted py-3">
                                    <i className="bi bi-check-circle me-1"></i>No additional services
                                  </td>
                                </tr>
                              ) : room.services.map((svc, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <span className="text-muted me-1">↳</span>
                                    {svc.name}
                                    {svc.orderTime && (
                                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                        {svc.orderTime}
                                      </small>
                                    )}
                                  </td>
                                  <td className="text-center">{svc.quantity || 1}</td>
                                  <td className="text-center">
                                    {svc.paid
                                      ? <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.7rem' }}>Paid</span>
                                      : <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.7rem' }}>Unpaid</span>
                                    }
                                  </td>
                                  {isRoomChange && (
                                    <td className="text-center">
                                      <small className="text-muted">{svc.roomName}</small>
                                    </td>
                                  )}
                                  <td className="text-end fw-medium">{fmtMoney(svc.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                            {room.services?.length > 0 && (
                              <tfoot className="table-light">
                                <tr>
                                  <td colSpan={isRoomChange ? 4 : 3} className="text-end text-muted small fw-bold">
                                    Unpaid / Paid:
                                  </td>
                                  <td className="text-end">
                                    <span className="text-danger fw-bold">{fmtMoney(room.serviceTotal)}</span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-success">{fmtMoney(room.servicePaidTotal)}</span>
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* ═══ TỔNG KẾT ═══ */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body py-2 px-3">
                      <div className="d-flex justify-content-between align-items-center py-1" style={{ fontSize: '0.88rem' }}>
                        <span className="text-dark">
                          Room Charge
                          {roomChargePaid && <span className="badge bg-success ms-2" style={{ fontSize: '0.6rem' }}>Paid</span>}
                        </span>
                        <span className="fw-bold">{fmtMoney(totalRoomCharge)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-1 fw-bold" style={{ fontSize: '0.95rem', borderTop: '1px solid #eee' }}>
                        <span>GRAND TOTAL</span>
                        <span>{fmtMoney(grandTotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-1 text-success" style={{ fontSize: '0.85rem' }}>
                        <span>Already Paid</span>
                        <span>- {fmtMoney(alreadyPaid)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-1 text-danger fw-bold" style={{ fontSize: '1.1rem', borderTop: '2px solid #dc3545' }}>
                        <span>AMOUNT DUE</span>
                        <span>{amountDue > 0 ? fmtMoney(amountDue) : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ CỘT PHẢI: THANH TOÁN ═══ */}
                <div className="col-lg-4 p-3 bg-white border-start d-flex flex-column">

                  {/* Payment method selector */}
                  <h6 className="fw-bold text-dark mb-2 text-center" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-wallet2 me-1"></i>PAYMENT
                  </h6>
                  <div className="d-flex gap-2 mb-3">
                    {PAYMENT_METHODS.map(({ value, icon, label }) => (
                      <button key={value} type="button"
                        className={`btn flex-fill py-2 d-flex flex-column align-items-center gap-1 fw-semibold ${paymentMethod === value ? 'btn-primary shadow' : 'btn-outline-secondary'}`}
                        onClick={() => setPaymentMethod(value)} disabled={isSubmitting}
                        style={{ fontSize: '0.72rem', transition: 'all 0.15s' }}>
                        <i className={`bi ${icon}`} style={{ fontSize: '1.2rem' }}></i>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Amount / QR display */}
                  {amountDue > 0 && paymentMethod === 'TRANSFER' ? (
                    <div className="p-3 bg-primary bg-opacity-10 rounded text-center mb-3 border border-primary flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 120 }}>
                      <i className="bi bi-bank text-primary" style={{ fontSize: '2rem' }}></i>
                      <div className="fw-bold text-primary fs-5 mt-2">{fmtMoney(amountDue)} VND</div>
                      <div className="small text-muted">Bank Transfer Amount</div>
                    </div>
                  ) : amountDue <= 0 ? (
                    <div className="p-3 bg-success bg-opacity-10 rounded text-center mb-3 border border-success flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 120 }}>
                      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                      <h6 className="text-success fw-bold mt-2 mb-0">FULLY PAID</h6>
                    </div>
                  ) : (
                    <div className="p-3 bg-warning bg-opacity-10 rounded text-center mb-3 border border-warning flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 120 }}>
                      <i className="bi bi-cash-stack text-warning" style={{ fontSize: '2rem' }}></i>
                      <div className="fw-bold text-warning-emphasis fs-5 mt-2">{fmtMoney(amountDue)} VND</div>
                      <div className="small text-muted">Amount to collect</div>
                    </div>
                  )}

                  {/* Room overview mini list */}
                  {rooms.length > 1 && (
                    <div className="mb-3 p-2 bg-light rounded" style={{ fontSize: '0.78rem' }}>
                      <small className="text-muted fw-bold d-block mb-1">
                        <i className="bi bi-list-ul me-1"></i>BILL BY ROOM
                      </small>
                      {rooms.map((room, idx) => (
                        <div key={idx}
                          className="d-flex justify-content-between align-items-center py-1"
                          style={{ borderBottom: idx < rooms.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                          <span>
                            <i className="bi bi-door-open me-1 text-muted"></i>
                            {room.roomName}
                            <span className="text-muted ms-1">({room.guestName?.split(' ').pop()})</span>
                          </span>
                          <span className="fw-semibold">
                            {fmtMoney(Number(room.roomPrice || 0) + Number(room.serviceTotal || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="d-grid gap-2 mt-auto">
                    <button className="btn btn-outline-dark fw-bold py-2" onClick={handlePrint} style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-printer-fill me-2"></i>Print Receipt
                    </button>
                    <button className="btn btn-danger fw-bold shadow-sm py-2"
                      onClick={handleConfirmCheckout}
                      disabled={isSubmitting || !paymentMethod}
                      style={{ fontSize: '0.85rem' }}>
                      {isSubmitting
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                        : <><i className="bi bi-check2-all me-2"></i>Confirm Checkout</>
                      }
                    </button>
                    {!paymentMethod && (
                      <p className="text-muted text-center mb-0" style={{ fontSize: '0.72rem' }}>
                        ⚠️ Please select a payment method to continue
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PRINT SECTION ═══ */}
      <div id="printable-receipt" className="bg-white text-dark p-2 d-none d-print-block">
        <div className="text-center mb-3">
          <h2 className="mb-0 fw-bold" style={{ fontSize: '18px' }}>{currentBranch.name}</h2>
          <div style={{ fontSize: '12px' }}>{currentBranch.address}</div>
          <div style={{ fontSize: '12px' }}>Tel: {currentBranch.phone}</div>
          <div className="mt-2 fw-bold" style={{ fontSize: '16px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
            GUEST RECEIPT
          </div>
        </div>

        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          <div><strong>Booking:</strong> {booking.bookingCode}</div>
          <div><strong>Guest:</strong> {booking.guestName}</div>
          <div><strong>In:</strong> {booking.checkIn} | <strong>Out:</strong> {booking.checkOut}</div>
          <div><strong>Payment:</strong> {methodLabel(paymentMethod)}</div>
          <div><strong>Printed:</strong> {new Date().toLocaleString()}</div>
        </div>

        {rooms.map((room, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px dashed #ccc', paddingBottom: '3px', marginBottom: '3px' }}>
              {room.roomName} - {room.guestName} ({room.roomTypeName})
              {room.roomHistory?.length > 1 && ` [${room.roomHistory.join('→')}]`}
            </div>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Room Charge</span><span>{fmtMoney(room.roomPrice)}</span>
              </div>
              {room.services?.map((svc, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- {svc.name} x{svc.quantity}{svc.paid ? ' ✓' : ''}</span>
                  <span>{fmtMoney(svc.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <strong>GRAND TOTAL:</strong><strong>{fmtMoney(grandTotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Paid:</span><span>- {fmtMoney(alreadyPaid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
            <span>DUE:</span><span>{amountDue > 0 ? fmtMoney(amountDue) : '0'}</span>
          </div>
        </div>

        {amountDue > 0 && paymentMethod === 'TRANSFER' && (
          <div className="text-center mt-4">
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>To be paid via Bank Transfer</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>{fmtMoney(amountDue)} VND</div>
          </div>
        )}

        <div className="text-center mt-4" style={{ fontSize: '12px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          Thank you for staying with us!<br />See you again.
        </div>
      </div>
    </>
  );
}