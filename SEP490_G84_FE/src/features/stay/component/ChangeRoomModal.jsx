import React, { useState, useEffect } from 'react';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/* ── Design tokens (project palette) ── */
const C = {
  primary:      COLORS.PRIMARY,
  primaryHover: COLORS.PRIMARY_HOVER,
  primaryLight: 'rgba(70,92,71,0.09)',
  danger:       COLORS.ERROR,
  dangerLight:  'rgba(220,53,69,0.08)',
  success:      '#198754',
  successLight: 'rgba(25,135,84,0.09)',
  border:       '#dde3dd',
  surface:      COLORS.TEXT_LIGHT,
  bg:           COLORS.SECONDARY,
  muted:        '#7a8a7b',
  text:         COLORS.TEXT_DARK,
};

const R = { sm: '6px', md: '10px', lg: '14px' };

const REASONS = [
  'Guest requested upgrade',
  'Guest requested downgrade',
  'Facility issue (AC, Plumbing, etc.)',
  'Noisy environment',
  'Other',
];

/* ── Field helper ── */
const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
    {hint && <span style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{hint}</span>}
  </div>
);

const inputStyle = (disabled) => ({
  padding: '8px 12px', borderRadius: R.sm, fontSize: 13.5,
  border: `1.5px solid ${C.border}`,
  background: disabled ? '#f0f2f0' : C.surface,
  color: C.text, outline: 'none', width: '100%',
  cursor: disabled ? 'not-allowed' : 'default',
});

const ChangeRoomModal = ({ show, onClose, stayInfo, onSuccess }) => {
  const currentUser = useCurrentUser();

  const [availableRooms,  setAvailableRooms]  = useState([]);
  const [roomTypes,       setRoomTypes]       = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedRoomId,  setSelectedRoomId]  = useState('');
  const [reason,          setReason]          = useState(REASONS[0]);
  const [note,            setNote]            = useState('');
  const [surcharge,       setSurcharge]       = useState(0);
  const [isFree,          setIsFree]          = useState(false);
  const [payNow,          setPayNow]          = useState(false);
  const [paymentMethod,   setPaymentMethod]   = useState('CASH');
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState('');
  const [loadingRooms,    setLoadingRooms]    = useState(false);

  useEffect(() => {
    if (show) {
      fetchAvailableRooms();
      setSelectedRoomType('');
      setSelectedRoomId('');
      setReason(REASONS[0]);
      setNote('');
      setSurcharge(0);
      setIsFree(false);
      setPayNow(false);
      setPaymentMethod('CASH');
      setError('');
    }
  }, [show]);

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await stayApi.getAvailableRooms(currentUser?.branchId, stayInfo?.stayId);
      setAvailableRooms(data);

      const typeMap = new Map();
      const types = [];
      data.forEach(room => {
        if (!typeMap.has(room.roomTypeId)) {
          typeMap.set(room.roomTypeId, true);
          types.push({ id: room.roomTypeId, name: room.roomTypeName, basePrice: room.basePrice });
        }
      });
      setRoomTypes(types);
    } catch {
      setError('Failed to load available rooms. Please try again.');
    } finally {
      setLoadingRooms(false);
    }
  };

  if (!show || !stayInfo) return null;

  const filteredRooms = availableRooms.filter(r => r.roomTypeId === parseInt(selectedRoomType));
  const selectedRoom  = availableRooms.find(r => r.roomId === parseInt(selectedRoomId));
  const canSubmit     = selectedRoomId && note.trim() && !isSubmitting;

  const handleRoomTypeChange = (val) => {
    setSelectedRoomType(val);
    setSelectedRoomId('');
    if (!isFree) setSurcharge(0);
  };

  const handleFreeToggle = (checked) => {
    setIsFree(checked);
    if (checked) {
      setSurcharge(0);
      setPayNow(false);
    }
  };

  const handleSurchargeChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // Loại bỏ không phải số
    if (!rawVal) {
      setSurcharge(0);
    } else {
      setSurcharge(parseInt(rawVal, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');
    
    // Convert surcharge state to number safely
    const finalSurcharge = surcharge ? parseInt(surcharge, 10) : 0;

    try {
      await stayApi.changeRoom({
        oldStayId: stayInfo.stayId,
        newRoomId:  parseInt(selectedRoomId),
        surcharge: finalSurcharge,
        reason: `${reason} — ${note}`,
        payNow: !isFree && finalSurcharge > 0 ? payNow : false,
        paymentMethod: paymentMethod,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1055,
        backgroundColor: 'rgba(15,20,30,0.60)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        background: C.surface,
        borderRadius: R.lg,
        width: '100%', maxWidth: '640px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: C.primary,
          padding: '20px 28px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: R.md,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-arrow-left-right" style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
                Change Room
              </h5>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff',
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              }}>
                <i className="bi bi-door-closed me-1" />
                Current: {stayInfo.roomName}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                {stayInfo.primaryGuestName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: R.sm, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16,
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: C.dangerLight, border: `1.5px solid ${C.danger}`,
              borderRadius: R.md, padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: C.danger }} />
              <span style={{ fontSize: 13, color: C.danger, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loadingRooms && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted }}>
              <span className="spinner-border spinner-border-sm me-2" />
              Loading available rooms…
            </div>
          )}

          {/* Section 1 — Room Selection */}
          <div style={{ background: C.surface, borderRadius: R.md, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px', background: C.primaryLight,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="bi bi-1-circle-fill" style={{ color: C.primary, fontSize: 15 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Select New Room
              </span>
            </div>
            <div style={{ padding: '18px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Room Type">
                <select
                  value={selectedRoomType}
                  onChange={e => handleRoomTypeChange(e.target.value)}
                  required
                  style={inputStyle(false)}
                >
                  <option value="">— Select type —</option>
                  {roomTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="Available Room"
                hint={
                  selectedRoomType && filteredRooms.length === 0
                    ? '⚠️ No rooms available for this type during the stay period.'
                    : selectedRoomType
                    ? 'Only rooms free for the full stay are shown.'
                    : null
                }
              >
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  disabled={!selectedRoomType || filteredRooms.length === 0}
                  required
                  style={inputStyle(!selectedRoomType || filteredRooms.length === 0)}
                >
                  <option value="">— Select room —</option>
                  {filteredRooms.map(r => (
                    <option key={r.roomId} value={r.roomId}>Room {r.roomName}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Selected room info */}
            {selectedRoom && (
              <div style={{
                margin: '0 16px 16px', padding: '10px 14px',
                background: C.primaryLight, borderRadius: R.sm,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
              }}>
                <i className="bi bi-check-circle-fill" style={{ color: C.primary }} />
                <span style={{ fontWeight: 600, color: C.primary }}>Room {selectedRoom.roomName}</span>
                <span style={{ color: C.muted }}>·</span>
                <span style={{ color: C.muted }}>{selectedRoom.roomTypeName}</span>
                {selectedRoom.basePrice > 0 && (
                  <>
                    <span style={{ color: C.muted }}>·</span>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      {Number(selectedRoom.basePrice).toLocaleString()} ₫/night
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Section 2 — Surcharge & Reason */}
          <div style={{ background: C.surface, borderRadius: R.md, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px', background: C.primaryLight,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="bi bi-2-circle-fill" style={{ color: C.primary, fontSize: 15 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Surcharge &amp; Reason
              </span>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Reason for Change">
                  <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle(false)}>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>

                <Field
                  label="Surcharge Amount (VND)"
                  hint="Manually enter the negotiated price difference."
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={surcharge === 0 ? '' : surcharge.toLocaleString('en-US')}
                      onChange={handleSurchargeChange}
                      disabled={isFree}
                      placeholder="0"
                      style={{ ...inputStyle(isFree), paddingRight: 110 }}
                    />
                    {/* Free toggle inline */}
                    <button
                      type="button"
                      onClick={() => handleFreeToggle(!isFree)}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                        border: `1.5px solid ${isFree ? C.success : C.border}`,
                        background: isFree ? C.successLight : 'transparent',
                        color: isFree ? C.success : C.muted,
                        cursor: 'pointer',
                      }}
                    >
                      {isFree ? '✓ Free' : 'Set Free'}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Payment Section (Chỉ hiển thị khi có phụ thu) */}
              {surcharge !== '' && Number(surcharge) > 0 && !isFree && (
                <div style={{
                  padding: '12px 16px', background: '#f5f7f5', 
                  borderRadius: R.sm, border: `1px dashed ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={payNow}
                      onChange={e => setPayNow(e.target.checked)}
                      style={{ accentColor: C.primary, width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>
                      Collect Surcharge Now
                    </span>
                  </label>
                  
                  {payNow && (
                    <div style={{ flex: 1, maxWidth: 200 }}>
                      <select 
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{...inputStyle(false), padding: '6px 12px'}}
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Credit/Debit Card</option>
                        <option value="TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <Field label="Detailed Note *">
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="E.g., Air conditioner in current room is leaking, moved guest to a new room…"
                  required
                  style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.5 }}
                />
              </Field>
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 28px', borderTop: `1px solid ${C.border}`,
          background: C.surface, display: 'flex', justifyContent: 'flex-end', gap: 10,
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '9px 22px', borderRadius: R.sm,
              border: `1.5px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '9px 26px', borderRadius: R.sm, border: 'none',
              background: canSubmit ? C.primary : '#b0bec5',
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background .15s',
            }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Processing…
              </>
            ) : (
              <>
                <i className="bi bi-arrow-left-right" />
                Confirm Room Change
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoomModal;