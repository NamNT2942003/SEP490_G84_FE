import React, { useState } from 'react';
import AddServiceModal from './AddServiceModal';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';
import ChangeRoomModal from './ChangeRoomModal';

// ─── Inline styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  .stay-detail-root {
    font-family: 'DM Sans', sans-serif;
    background: #f5f6f3;
    min-height: 100vh;
    padding: 24px;
    color: #2b2b2b;
  }

  /* ── Back button ── */
  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border: 1.5px solid #465c47;
    border-radius: 8px;
    background: transparent;
    color: #465c47;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all .2s;
    margin-bottom: 20px;
  }
  .btn-back:hover {
    background: #465c47;
    color: #fff;
  }

  /* ── Card ── */
  .sd-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(70,92,71,.12);
  }

  /* ── Card Header ── */
  .sd-card-header {
    background: linear-gradient(135deg, #465c47 0%, #384a39 100%);
    padding: 22px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sd-card-header h2 {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    letter-spacing: .3px;
  }
  .sd-total-badge {
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 50px;
    padding: 6px 18px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }
  .sd-total-badge span {
    color: #d4edda;
    font-size: 15px;
  }

  /* ── Info bar ── */
  .sd-info-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    background: #f0f2f0;
    border-bottom: 1px solid #e4e8e4;
  }
  .sd-info-item {
    padding: 16px 28px;
  }
  .sd-info-item:first-child {
    border-right: 1px solid #e4e8e4;
  }
  .sd-info-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #8a9a8b;
    margin-bottom: 4px;
  }
  .sd-info-value {
    font-size: 15px;
    font-weight: 600;
    color: #2b2b2b;
  }

  /* ── Section ── */
  .sd-section {
    padding: 24px 28px;
  }
  .sd-section + .sd-section {
    border-top: 1px solid #eef0ee;
  }
  .sd-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: #465c47;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sd-section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #465c47, #8aab8b);
    border-radius: 4px;
    flex-shrink: 0;
  }

  /* ── Scrollable table wrapper ── */
  .sd-table-scroll {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 280px;
    border-radius: 10px;
    border: 1px solid #e4e8e4;
    box-shadow: 0 2px 8px rgba(70,92,71,.06);
  }
  .sd-table-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .sd-table-scroll::-webkit-scrollbar-track { background: #f0f2f0; }
  .sd-table-scroll::-webkit-scrollbar-thumb { background: #b0c4b1; border-radius: 4px; }
  .sd-table-scroll::-webkit-scrollbar-thumb:hover { background: #465c47; }

  /* ── Table ── */
  .sd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .sd-table thead tr {
    background: #465c47;
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .sd-table thead th {
    color: #fff;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .7px;
    padding: 12px 16px;
    text-align: left;
    white-space: nowrap;
  }
  .sd-table tbody tr {
    border-bottom: 1px solid #eef0ee;
    transition: background .15s;
  }
  .sd-table tbody tr:last-child { border-bottom: none; }
  .sd-table tbody tr:hover { background: #f7f9f7; }
  .sd-table tbody tr.cancelled-row {
    background: #fafafa;
    opacity: .75;
  }
  .sd-table td {
    padding: 12px 16px;
    vertical-align: middle;
  }

  /* ── Room badge ── */
  .room-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #384a39;
    color: #fff;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .3px;
  }

  /* ── Status badges ── */
  .badge-paid    { background: #d4edda; color: #2d6a4f; border: 1px solid #b7dfc8; border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
  .badge-unpaid  { background: #fff3cd; color: #856404; border: 1px solid #ffe08a; border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
  .badge-cancel  { background: #e9ecef; color: #6c757d; border: 1px solid #dee2e6; border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 600; }

  /* ── Action buttons ── */
  .btn-add-service {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border: 1.5px solid #465c47;
    border-radius: 7px;
    background: transparent;
    color: #465c47;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    margin-right: 6px;
  }
  .btn-add-service:hover { background: #465c47; color: #fff; }

  .btn-change-room {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border: 1.5px solid #8aab8b;
    border-radius: 7px;
    background: transparent;
    color: #465c47;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .btn-change-room:hover { background: #8aab8b; color: #fff; }

  .btn-cancel-svc {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border: 1.5px solid #dc3545;
    border-radius: 7px;
    background: transparent;
    color: #dc3545;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .btn-cancel-svc:hover { background: #dc3545; color: #fff; }

  /* ── Amount ── */
  .amount-positive { color: #c0392b; font-weight: 700; }
  .amount-cancelled { color: #aaa; font-weight: 400; text-decoration: line-through; }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 32px;
    color: #9aaa9b;
    font-size: 14px;
  }
  .empty-state svg { margin-bottom: 10px; opacity: .4; }

  /* ── Confirm Modal ── */
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
    animation: fadeInOverlay .2s ease;
  }
  @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
  .confirm-modal {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    width: 420px;
    max-width: 92vw;
    box-shadow: 0 20px 60px rgba(0,0,0,.2);
    animation: slideUp .25s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes slideUp { from { opacity:0; transform: translateY(30px) scale(.96) } to { opacity:1; transform: none } }
  .confirm-header {
    background: linear-gradient(135deg, #dc3545, #b02a37);
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
  }
  .confirm-header h3 { margin: 0; font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .confirm-body { padding: 28px 24px; text-align: center; font-size: 16px; line-height: 1.6; color: #444; }
  .confirm-body strong { color: #dc3545; font-size: 17px; }
  .confirm-footer {
    padding: 16px 24px;
    background: #f9f9f9;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid #eee;
  }
  .btn-close-modal {
    padding: 8px 20px;
    border: 1.5px solid #ccc;
    border-radius: 8px;
    background: #fff;
    color: #555;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all .2s;
  }
  .btn-close-modal:hover { border-color: #999; background: #f0f0f0; }
  .btn-confirm-cancel {
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #dc3545, #b02a37);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(220,53,69,.3);
    transition: all .2s;
  }
  .btn-confirm-cancel:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(220,53,69,.4); }

  @media (max-width: 600px) {
    .sd-info-bar { grid-template-columns: 1fr; }
    .sd-info-item:first-child { border-right: none; border-bottom: 1px solid #e4e8e4; }
    .sd-section { padding: 18px 16px; }
    .sd-card-header { padding: 16px; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
const StayDetail = ({ booking, onBack, onRefresh }) => {
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [selectedStay, setSelectedStay]     = useState(null);
  const [cancelModalData, setCancelModalData] = useState({ isOpen: false, orderId: null, serviceName: '' });
  const [isChangeModalOpen, setIsChangeModalOpen]         = useState(false);
  const [selectedStayForChange, setSelectedStayForChange] = useState(null);

  const handleOpenChangeRoom = (stay) => {
    setSelectedStayForChange({ ...stay, bookingId: booking.bookingId });
    setIsChangeModalOpen(true);
  };

  const handleOpenModal = (stay) => {
    setSelectedStay(stay);
    setIsModalOpen(true);
  };

  const triggerCancelClick = (orderId, serviceName) => {
    setCancelModalData({ isOpen: true, orderId, serviceName });
  };

  const executeCancelService = async () => {
    try {
      await stayApi.cancelService(cancelModalData.orderId);
      setCancelModalData({ isOpen: false, orderId: null, serviceName: '' });
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling service!');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    return new Date(timeString).toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusMap = {
    'Đã thanh toán':   { label: 'Paid',      cls: 'badge-paid' },
    'Chưa thanh toán': { label: 'Unpaid',    cls: 'badge-unpaid' },
    'CANCELED':        { label: 'Cancelled', cls: 'badge-cancel' },
  };

  return (
    <>
      <style>{css}</style>
      <div className="stay-detail-root">

        {/* ── Back ── */}
        <button className="btn-back" onClick={onBack}>
          ← Back to Bookings
        </button>

        {/* ── Main card ── */}
        <div className="sd-card">

          {/* Header */}
          <div className="sd-card-header">
            <h2>Booking · {booking?.bookingCode}</h2>
            <div className="sd-total-badge">
              Service Total&nbsp;
              <span>{(booking?.serviceTotal || 0).toLocaleString('en-US')} VND</span>
            </div>
          </div>

          {/* Info bar */}
          <div className="sd-info-bar">
            <div className="sd-info-item">
              <div className="sd-info-label">Booker Name</div>
              <div className="sd-info-value">{booking?.bookerName || '—'}</div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-label">Stay Time</div>
              <div className="sd-info-value">{booking?.stayTime || '—'}</div>
            </div>
          </div>

          {/* ── Section 1: Room List ── */}
          <div className="sd-section">
            <div className="sd-section-title">Room List (Stays)</div>
            <div className="sd-table-scroll">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Primary Guest</th>
                    <th>Check-in Time</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {booking?.stays?.length > 0 ? (
                    booking.stays.map((stay) => (
                      <tr key={stay.stayId}>
                        <td><span className="room-badge">🏠 {stay.roomName}</span></td>
                        <td style={{ fontWeight: 600 }}>{stay.primaryGuestName}</td>
                        <td style={{ color: '#666', fontSize: 13 }}>{formatTime(stay.checkInTime)}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button className="btn-add-service" onClick={() => handleOpenModal(stay)}>
                            ＋ Add Service
                          </button>
                          <button className="btn-change-room" onClick={() => handleOpenChangeRoom(stay)}>
                            ⇄ Change Room
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
                        <div className="empty-state">No room information available.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 2: Service Orders ── */}
          <div className="sd-section">
            <div className="sd-section-title">Service Order History</div>
            <div className="sd-table-scroll">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Service</th>
                    <th>Order Time</th>
                    <th>Qty</th>
                    <th>Amount (VND)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {booking?.serviceOrders?.length > 0 ? (
                    booking.serviceOrders.map((order) => {
                      const isCancelled = order.paymentStatus === 'CANCELED';
                      const statusInfo  = statusMap[order.paymentStatus] || { label: order.paymentStatus, cls: 'badge-unpaid' };
                      return (
                        <tr key={order.orderId} className={isCancelled ? 'cancelled-row' : ''}>
                          <td><span className="room-badge" style={{ background: '#5a7a5b', fontSize: 12 }}>{order.roomName}</span></td>
                          <td>{order.serviceName}</td>
                          <td style={{ color: '#777', fontSize: 13 }}>{formatTime(order.orderTime)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{order.quantity}</td>
                          <td>
                            <span className={isCancelled ? 'amount-cancelled' : 'amount-positive'}>
                              {order.orderPrice?.toLocaleString('en-US')}
                            </span>
                          </td>
                          <td>
                            <span className={statusInfo.cls}>{statusInfo.label}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {!isCancelled && (
                              <button className="btn-cancel-svc" onClick={() => triggerCancelClick(order.orderId, order.serviceName)}>
                                ✕ Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">No services ordered yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* end sd-card */}
      </div>{/* end root */}

      {/* Modals */}
      <AddServiceModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stayInfo={selectedStay}
        onSuccess={onRefresh}
      />
      <ChangeRoomModal
        show={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        stayInfo={selectedStayForChange}
        onSuccess={onRefresh}
      />

      {/* ── Confirm Cancel Modal ── */}
      {cancelModalData.isOpen && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-header">
              <h3>⚠ Confirm Cancellation</h3>
              <button
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
                onClick={() => setCancelModalData({ isOpen: false, orderId: null, serviceName: '' })}
              >×</button>
            </div>
            <div className="confirm-body">
              Are you sure you want to cancel the service<br />
              <strong>"{cancelModalData.serviceName}"</strong>?
            </div>
            <div className="confirm-footer">
              <button
                className="btn-close-modal"
                onClick={() => setCancelModalData({ isOpen: false, orderId: null, serviceName: '' })}
              >Close</button>
              <button className="btn-confirm-cancel" onClick={executeCancelService}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StayDetail;