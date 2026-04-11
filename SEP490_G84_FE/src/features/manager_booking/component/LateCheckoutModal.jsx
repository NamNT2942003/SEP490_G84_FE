import React, { useState, useEffect } from 'react';
import { checkoutApi } from '../api/checkoutApi';
import { COLORS } from '@/constants';
import Swal from 'sweetalert2';

/* ── Design tokens (project palette) ── */
const C = {
  primary:      COLORS.PRIMARY,        
  primaryHover: COLORS.PRIMARY_HOVER,  
  border:       '#dde3dd',
  surface:      COLORS.TEXT_LIGHT,     
  bg:           COLORS.SECONDARY,      
  muted:        '#7a8a7b',
  text:         COLORS.TEXT_DARK, 
  error:        COLORS.ERROR     
};

const R = { sm: '6px', md: '10px', lg: '14px' };

/* ── Component ── */
const LateCheckoutModal = ({ show, onClose, booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feasibilityList, setFeasibilityList] = useState([]);
  
  // Array of { stayId, amount, note }
  const [feesData, setFeesData] = useState([]);

  useEffect(() => {
    if (show && booking) {
      fetchFeasibility();
    } else {
      setFeasibilityList([]);
      setFeesData([]);
    }
  }, [show, booking]);

  const fetchFeasibility = async () => {
    setLoading(true);
    try {
      const data = await checkoutApi.checkLateCheckoutFeasibility(booking.id || booking.bookingId);
      setFeasibilityList(data);
      // Initialize fees data
      setFeesData(data.map(d => ({
        stayId: d.stayId,
        amount: '',
        note: ''
      })));
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load room feasibility.' });
    } finally {
      setLoading(false);
    }
  };

  if (!show || !booking) return null;

  const handleUpdateFee = (stayId, field, value) => {
    setFeesData(prev => prev.map(f => 
      f.stayId === stayId ? { ...f, [field]: value } : f
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter only those with amount > 0 and format amount to number
    const finalFees = feesData
      .filter(f => parseFloat(f.amount) > 0)
      .map(f => ({
        stayId: f.stayId,
        amount: parseFloat(f.amount),
        note: f.note
      }));

    if (finalFees.length === 0) {
      Swal.fire({ icon: 'info', text: 'No late checkout fees were entered.' });
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await checkoutApi.applyLateCheckoutSurcharges(booking.id || booking.bookingId, { fees: finalFees });
      
      Swal.fire({
         icon: 'success', 
         title: 'Success', 
         text: 'Late checkout fees have been added to the bill.',
         timer: 1500,
         showConfirmButton: false
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to apply surcharges' });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if at least one room has > 0 fee
  const hasUpdates = feesData.some(f => parseFloat(f.amount) > 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        backgroundColor: 'rgba(15,20,30,0.60)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}
    >
      <div style={{
        background: C.surface,
        borderRadius: R.lg,
        width: '100%', maxWidth: '800px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: C.bg,
          padding: '20px 28px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: R.md,
                background: C.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-clock-history" style={{ color: C.primary, fontSize: 18 }} />
              </div>
              <h5 style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: 18 }}>
                Request Late Check-out
              </h5>
            </div>
            <div style={{ marginTop: 6, color: C.muted, fontSize: 13 }}>
              Check availability and assign late check-out fees per room for booking <strong>{booking.bookingCode}</strong>.
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              width: 32, height: 32, borderRadius: R.sm,
              border: `1.5px solid ${C.border}`, background: C.surface,
              cursor: 'pointer', color: C.muted, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s'
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#fdfdfd' }}>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-2 text-muted small">Checking inventory for tonight...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feasibilityList.map((room, idx) => {
                  const rFee = feesData.find(f => f.stayId === room.stayId) || {};
                  
                  return (
                    <div key={idx} style={{
                      display: 'flex', gap: 16, alignItems: 'center',
                      background: room.canLateCheckout ? '#ffffff' : '#fcfcfc',
                      border: `1.5px solid ${room.canLateCheckout ? C.border : '#ffedec'}`,
                      borderRadius: R.md, padding: '16px 20px',
                      opacity: room.canLateCheckout ? 1 : 0.85
                    }}>
                      {/* Room Info */}
                      <div style={{ width: '220px', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>
                          <i className="bi bi-door-closed me-2 text-primary" />
                          {room.roomName}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{room.roomTypeName}</div>
                        <div style={{ marginTop: 8 }}>
                          {room.canLateCheckout ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                               <i className="bi bi-check-circle me-1"></i>Available tonight
                            </span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                               <i className="bi bi-x-circle me-1"></i>Fully Booked!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inputs */}
                      <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                         <div style={{ width: '150px' }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                              Late Fee (VND)
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={!room.canLateCheckout || submitting}
                              placeholder="0"
                              value={rFee.amount}
                              onChange={(e) => handleUpdateFee(room.stayId, 'amount', e.target.value)}
                              style={{
                                width: '100%', padding: '10px 14px', borderRadius: R.sm,
                                border: `1.5px solid ${C.border}`,
                                outline: 'none', fontSize: 14,
                                backgroundColor: room.canLateCheckout ? '#fff' : '#f4f4f4',
                                color: room.canLateCheckout ? C.text : C.muted
                              }}
                            />
                         </div>
                         <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                              Note
                            </label>
                            <input
                              type="text"
                              disabled={!room.canLateCheckout || submitting}
                              placeholder="e.g. Extended to 16:00"
                              value={rFee.note}
                              onChange={(e) => handleUpdateFee(room.stayId, 'note', e.target.value)}
                              style={{
                                width: '100%', padding: '10px 14px', borderRadius: R.sm,
                                border: `1.5px solid ${C.border}`,
                                outline: 'none', fontSize: 14,
                                backgroundColor: room.canLateCheckout ? '#fff' : '#f4f4f4',
                                color: room.canLateCheckout ? C.text : C.muted
                              }}
                            />
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && feasibilityList.length === 0 && (
              <div className="text-center text-muted py-4">No active rooms found.</div>
            )}
            
            <div style={{
              background: 'rgba(70,92,71,0.06)',
              borderRadius: R.sm, padding: '12px 16px',
              marginTop: 20, fontSize: 12.5, color: '#444',
              display: 'flex', gap: 10
            }}>
              <i className="bi bi-info-circle-fill text-primary" style={{ fontSize: 15 }} />
              <div>
                <strong>Inventory Check:</strong> Rooms marked as <em>Fully Booked</em> cannot be extended because they are reserved for incoming guests today. Late fees entered here will be added to the final checkout bill as unpaid services.
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '16px 28px', borderTop: `1px solid ${C.border}`,
            background: '#fff',
            display: 'flex', justifyContent: 'flex-end', gap: 12
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 24px', borderRadius: R.sm,
                border: `1.5px solid ${C.border}`, background: '#fff',
                fontSize: 14, fontWeight: 600, color: C.text, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || !hasUpdates}
              style={{
                padding: '10px 24px', borderRadius: R.sm,
                border: 'none', background: (!hasUpdates || submitting) ? '#b0c0b1' : C.primary,
                fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {submitting ? (
                <><span className="spinner-border spinner-border-sm" /> Processing...</>
              ) : (
                'Apply Surcharges'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LateCheckoutModal;
