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
  const [stayPaymentMethods, setStayPaymentMethods] = useState({}); // stayId -> paymentMethod
  const [activeRoomIdx, setActiveRoomIdx] = useState('ALL');
  const currentBranch = BRANCH_CONFIG[branchId] || {
    name: "AN Nguyen HOTEL & RESORT", address: "Ha Noi, Vietnam", phone: "0123.456.789"
  };

  const fetchBilling = () => {
    setLoadingBill(true);
    checkoutApi.getRoomBillingInfo(booking.id)
      .then(data => setRoomBilling(data))
      .catch(err => {
        console.error('Error fetching room billing:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load room billing details. Please try again.' });
      })
      .finally(() => setLoadingBill(false));
  };

  useEffect(() => {
    if (!show || !booking) return;
    setPaymentMethod('');
    setStayPaymentMethods({});
    setActiveRoomIdx('ALL');
    fetchBilling();
  }, [show, booking]);

  // Khi billing load xong: init stayPaymentMethods với mỗi stayId
  useEffect(() => {
    if (!roomBilling?.rooms) return;
    const init = {};
    roomBilling.rooms.forEach(r => { if (r.stayId) init[r.stayId] = ''; });
    setStayPaymentMethods(init);
  }, [roomBilling]);

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
  const pendingRooms = rooms.filter(r => !r.checkedOut);
  const allPaymentsSelected = pendingRooms.every(r => {
    const due = Number(r.amountDue || 0);
    return due <= 0 || stayPaymentMethods[r.stayId];
  });

  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Transfer' : 'Cash';
  const fmtMoney = (v) => Number(v || 0).toLocaleString();

  const handlePrint = () => window.print();

  const handleCheckoutRoom = async (stayId) => {
    const room = rooms.find(r => r.stayId === stayId);
    const roomName = room?.roomName || 'this room';
    const due = Number(room?.amountDue || 0);
    
    let method = stayPaymentMethods[stayId];
    if (due > 0 && !method) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please select a payment method for this room.' });
      return;
    }
    if (!method) method = 'CASH'; // fallback if 0 due

    // Check if this is the last pending room and room balance is unpaid
    const pendingCount = rooms.filter(r => !r.checkedOut).length;
    const isLastRoom = pendingCount === 1;
    const hasRoomDebt = isLastRoom && !roomChargePaid;

    if (Number(roomBilling?.roomBalance || 0) > 0 && isLastRoom) {
      const roomDebt = Number(roomBilling.roomBalance);
      const debtConfirm = await Swal.fire({
        icon: 'warning',
        title: '⚠️ Checkout with Debt?',
        html: `
          <div style="text-align:left; font-size:0.9rem;">
            <div style="margin-bottom:8px;">
              <b>Outstanding Room Debt:</b> <span style="color:#dc3545; font-weight:700;">${fmtMoney(roomDebt)} VND</span>
            </div>
            <div style="padding:10px; background:#fff3cd; border-radius:6px; color:#856404;">
              This is the <b>last room</b>. Are you sure you want to proceed?<br/>
              This checkout will <b>only collect service charges</b>.<br/>
              The room debt will be recorded in the system.
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirm Checkout',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancel',
      });
      if (!debtConfirm.isConfirmed) return;
    } else {
      const confirm = await Swal.fire({
        icon: 'question',
        title: `Checkout ${roomName}?`,
        html: due > 0
          ? `Collect <b>${Number(due).toLocaleString()} VND</b> via <b>${method}</b> and check out ${roomName}.`
          : `No outstanding charges. Check out ${roomName}.`,
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        confirmButtonColor: '#dc3545',
      });
      if (!confirm.isConfirmed) return;
    }

    setIsSubmitting(true);
    try {
      await checkoutApi.checkoutSingleRoom(booking.id, { stayId, paymentMethod: method });
      Swal.fire({ icon: 'success', title: 'Done!', text: `${roomName} checked out!`, timer: 1800, showConfirmButton: false });
      // Reload billing để cập nhật trạng thái các phòng còn lại
      await fetchBilling();
      if (onSuccess) onSuccess();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Checkout Failed', text: error.response?.data?.error || 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-room checkout all at once (dùng API split checkout)
  const handleCheckoutAll = async () => {
    if (!allPaymentsSelected) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please select a payment method for all rooms with outstanding charges.' });
      return;
    }

    const totalDue = pendingRooms.reduce((sum, r) => sum + Number(r.amountDue || 0), 0);

    if (Number(roomBilling?.roomBalance || 0) > 0) {
      const roomDebt = Number(roomBilling.roomBalance);
      const debtConfirm = await Swal.fire({
        icon: 'warning',
        title: '⚠️ Checkout All with Debt?',
        html: `
          <div style="text-align:left; font-size:0.9rem;">
            <div style="margin-bottom:8px;">
              <b>Outstanding Room Debt:</b> <span style="color:#dc3545; font-weight:700;">${fmtMoney(roomDebt)} VND</span>
            </div>
            <div style="padding:10px; background:#fff3cd; border-radius:6px; color:#856404;">
              You are checking out <b>all ${pendingRooms.length} rooms</b>.<br/>
              ${totalDue > 0 ? `Service charges of <b>${fmtMoney(totalDue)} VND</b> will be collected.<br/>` : ''}
              The room debt will be recorded in the system.
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirm Checkout All',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancel',
      });
      if (!debtConfirm.isConfirmed) return;
    } else {
      const confirm = await Swal.fire({
        icon: 'question',
        title: `Checkout All ${pendingRooms.length} Rooms?`,
        html: totalDue > 0
          ? `Collect <b>${fmtMoney(totalDue)} VND</b> total service charges and check out all rooms.`
          : `No outstanding charges. Check out all rooms.`,
        showCancelButton: true,
        confirmButtonText: 'Confirm Checkout All',
        confirmButtonColor: '#dc3545',
      });
      if (!confirm.isConfirmed) return;
    }

    setIsSubmitting(true);
    try {
      const roomPayments = pendingRooms.map(room => ({
        stayId: room.stayId,
        paymentMethod: stayPaymentMethods[room.stayId] || 'CASH',
      }));
      await checkoutApi.processSplitCheckout(booking.id, { roomPayments });
      Swal.fire({ icon: 'success', title: 'Done!', text: 'All rooms checked out successfully!', timer: 2000, showConfirmButton: false });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Checkout Failed', text: error.response?.data?.error || 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single-room checkout (booking 1 phòng, dùng API cũ)
  const handleConfirmCheckout = async () => {
    let method = paymentMethod;
    if (amountDue > 0 && !method) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please select a payment method to continue.' });
      return;
    }
    if (!method) method = 'CASH'; // fallback if 0 due

    // Check if room balance is unpaid
    if (Number(roomBilling?.roomBalance || 0) > 0) {
      const roomDebt = Number(roomBilling.roomBalance);
      const debtConfirm = await Swal.fire({
        icon: 'warning',
        title: '⚠️ Checkout with Debt?',
        html: `
          <div style="text-align:left; font-size:0.9rem;">
            <div style="margin-bottom:8px;">
              <b>Outstanding Room Debt:</b> <span style="color:#dc3545; font-weight:700;">${fmtMoney(roomDebt)} VND</span>
            </div>
            <div style="padding:10px; background:#fff3cd; border-radius:6px; color:#856404;">
              Are you sure you want to proceed?<br/>
              This checkout will <b>only collect service charges</b>.<br/>
              The room debt will be recorded in the system.
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirm Checkout',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancel',
      });
      if (!debtConfirm.isConfirmed) return;
    }

    setIsSubmitting(true);
    try {
      await checkoutApi.processCheckout(booking.id, method);
      Swal.fire({ icon: 'success', title: 'Done!', text: 'Check-out completed successfully!', timer: 2000, showConfirmButton: false });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Checkout Failed', text: error.response?.data?.error || 'An error occurred during check-out.' });
    } finally { setIsSubmitting(false); }
  };

  const hasRoomChange = activeRoom?.roomHistory?.length > 1;

  return (
    <>
      <div className="modal-backdrop fade show no-print" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block no-print" tabIndex="-1"
        style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered"
          style={{ maxWidth: 1500, margin: '1.5rem auto', maxHeight: 'calc(100vh - 3rem)' }}>
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
                <div className="col-lg-7 p-3" style={{ backgroundColor: '#f8f9fa' }}>

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
                                  <td className="text-end fw-medium">{fmtMoney((svc.amount || 0) * (svc.quantity || 1))}</td>
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
                      
                      {Number(roomBilling.roomBalance || 0) > 0 && (
                        <>
                          <div className="d-flex justify-content-between align-items-center py-1 text-warning-emphasis fw-bold" style={{ fontSize: '0.95rem', borderTop: '1px dashed #ffc107', marginTop: 4 }}>
                            <span>UNPAID ROOM DEBT</span>
                            <span>{fmtMoney(roomBilling.roomBalance)}</span>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic', marginBottom: 4 }}>
                            (Note: Room debt is collected separately, not during this checkout)
                          </div>
                        </>
                      )}

                      <div className="d-flex justify-content-between align-items-center py-1 text-danger fw-bold" style={{ fontSize: '1.05rem', borderTop: '2px solid #dc3545', marginTop: 8 }}>
                        <span>SERVICE AMOUNT DUE</span>
                        <span>{amountDue > 0 ? fmtMoney(amountDue) : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ CỘT PHẢI: THANH TOÁN ═══ */}
                <div className="col-lg-5 p-3 bg-white border-start d-flex flex-column">

                  <h6 className="fw-bold text-dark mb-2 text-center" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-wallet2 me-1"></i>PAYMENT
                  </h6>

                  {/* WARNING: Room balance chưa thu */}
                  {Number(roomBilling.roomBalance || 0) > 0 && (
                    <div className="mb-2 p-2 rounded border border-warning" style={{ background: '#fff8e1', fontSize: '0.78rem' }}>
                      <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                      <strong>Outstanding Room Debt: {fmtMoney(roomBilling.roomBalance)} VND</strong>
                      <div className="text-muted mt-1">
                        This checkout only collects service charges. Room debt will be recorded and collected later.
                      </div>
                    </div>
                  )}

                  {rooms.length > 1 ? (
                    /* ── MULTI-ROOM: mỗi phòng có payment selector + nút Checkout riêng ── */
                    <div className="flex-grow-1 overflow-auto" style={{ gap: 8 }}>
                      {rooms.map((room, idx) => {
                        const due = Number(room.amountDue || 0);
                        const selectedMethod = stayPaymentMethods[room.stayId] || '';
                        const isRoomDone = room.checkedOut === true;
                        return (
                          <div key={idx} className={`mb-2 p-2 rounded border ${isRoomDone ? 'border-success bg-success bg-opacity-10' : 'bg-white'}`}
                            style={{ fontSize: '0.8rem' }}>
                            {/* Header phòng */}
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold">
                                <i className="bi bi-door-open me-1 text-primary"></i>
                                {room.roomName}
                                <span className="text-muted ms-1">({room.guestName?.split(' ').pop()})</span>
                              </span>
                              {isRoomDone
                                ? <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Checked Out</span>
                                : due > 0
                                  ? <span className="badge bg-danger-subtle text-danger">{fmtMoney(due)} VND</span>
                                  : <span className="badge bg-secondary-subtle text-secondary">No charge</span>
                              }
                            </div>

                            {/* Payment + nút Checkout (chỉ hiện khi chưa checkout) */}
                            {!isRoomDone && (
                              <>
                                {due > 0 && (
                                  <div className="d-flex gap-1 mb-1">
                                    {PAYMENT_METHODS.map(({ value, icon, label }) => (
                                      <button key={value} type="button"
                                        className={`btn btn-sm flex-fill py-1 d-flex flex-column align-items-center gap-0 fw-semibold ${
                                          selectedMethod === value ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                                        }`}
                                        onClick={() => setStayPaymentMethods(prev => ({ ...prev, [room.stayId]: value }))}
                                        disabled={isSubmitting}
                                        style={{ fontSize: '0.65rem' }}>
                                        <i className={`bi ${icon}`} style={{ fontSize: '0.9rem' }}></i>
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button
                                  className={`btn btn-sm w-100 fw-bold ${
                                    due > 0
                                      ? (selectedMethod ? 'btn-danger' : 'btn-outline-danger')
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() => handleCheckoutRoom(room.stayId)}
                                  disabled={isSubmitting || (due > 0 && !selectedMethod)}
                                  style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-box-arrow-right me-1"></i>
                                  {due > 0 ? `Collect ${fmtMoney(due)} & Checkout` : 'Checkout Room'}
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── SINGLE-ROOM: selector chung + nút checkout ── */
                    <>
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

                      {/* Amount display */}
                      {amountDue > 0 && paymentMethod === 'TRANSFER' ? (
                        <div className="p-3 bg-primary bg-opacity-10 rounded text-center mb-3 border border-primary flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 80 }}>
                          <i className="bi bi-bank text-primary" style={{ fontSize: '2rem' }}></i>
                          <div className="fw-bold text-primary fs-5 mt-2">{fmtMoney(amountDue)} VND</div>
                          <div className="small text-muted">Bank Transfer Amount</div>
                        </div>
                      ) : amountDue <= 0 ? (
                        <div className="p-3 bg-success bg-opacity-10 rounded text-center mb-3 border border-success flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 80 }}>
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                          <h6 className="text-success fw-bold mt-2 mb-0">FULLY PAID</h6>
                        </div>
                      ) : (
                        <div className="p-3 bg-warning bg-opacity-10 rounded text-center mb-3 border border-warning flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 80 }}>
                          <i className="bi bi-cash-stack text-warning" style={{ fontSize: '2rem' }}></i>
                          <div className="fw-bold text-warning-emphasis fs-5 mt-2">{fmtMoney(amountDue)} VND</div>
                          <div className="small text-muted">Amount to collect</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="d-grid gap-2 mt-auto">
                    <button className="btn btn-outline-dark fw-bold py-2" onClick={handlePrint} style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-printer-fill me-2"></i>Print Receipt
                    </button>
                    {rooms.length <= 1 && (
                      <>
                        <button className="btn btn-danger fw-bold shadow-sm py-2"
                          onClick={handleConfirmCheckout}
                          disabled={isSubmitting || (amountDue > 0 && !paymentMethod)}
                          style={{ fontSize: '0.85rem' }}>
                          {isSubmitting
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                            : <><i className="bi bi-check2-all me-2"></i>Confirm Checkout</>
                          }
                        </button>
                        {amountDue > 0 && !paymentMethod && (
                          <p className="text-muted text-center mb-0" style={{ fontSize: '0.72rem' }}>
                            ⚠️ Please select a payment method to continue
                          </p>
                        )}
                      </>
                    )}
                    {rooms.length > 1 && pendingRooms.length > 0 && (
                      <>
                        <button className="btn btn-danger fw-bold shadow-sm py-2"
                          onClick={handleCheckoutAll}
                          disabled={isSubmitting || !allPaymentsSelected}
                          style={{ fontSize: '0.85rem' }}>
                          {isSubmitting
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                            : <><i className="bi bi-check2-all me-2"></i>Checkout All ({pendingRooms.length} rooms)</>
                          }
                        </button>
                        {!allPaymentsSelected && (
                          <p className="text-muted text-center mb-0" style={{ fontSize: '0.72rem' }}>
                            ⚠️ Please select payment methods for all rooms
                          </p>
                        )}
                      </>
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
              {room.services?.map((svc, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- {svc.name} x{svc.quantity}{svc.paid ? ' ✓' : ''}</span>
                  <span>{fmtMoney((svc.amount || 0) * (svc.quantity || 1))}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
            <span>SERVICE DUE:</span><span>{amountDue > 0 ? fmtMoney(amountDue) : '0'}</span>
          </div>
          {Number(roomBilling.roomBalance || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', color: '#dc3545', marginTop: '4px' }}>
              <span>UNPAID ROOM DEBT:</span><span>{fmtMoney(roomBilling.roomBalance)}</span>
            </div>
          )}
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