import React, { useState, useEffect } from 'react';
import { checkInApi } from '../api/checkInApi';
import Swal from 'sweetalert2';

/* ── Project color tokens ── */
const C = {
  PRIMARY:       '#465c47',
  PRIMARY_HOVER: '#384a39',
  SECONDARY:     '#f0f2f0',
  TEXT_DARK:     '#333333',
  TEXT_LIGHT:    '#ffffff',
  ERROR:         '#dc3545',
  BORDER:        '#dde3dd',
  SURFACE:       '#ffffff',
  MUTED:         '#7a8a7b',
};

const radius = { sm: '8px', md: '12px', lg: '16px' };
const font   = "'DM Sans', sans-serif";

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1050,
    background: 'rgba(30,38,30,0.5)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', fontFamily: font,
  },
  shell: {
    background: C.SURFACE, borderRadius: radius.lg,
    width: '100%', maxWidth: '840px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,.18)',
  },
  header: {
    padding: '20px 28px 18px', borderBottom: `1px solid ${C.BORDER}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: C.TEXT_DARK, letterSpacing: '-0.2px' },
  headerSub:   { margin: '2px 0 0', fontSize: '12.5px', color: C.MUTED },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    border: `1.5px solid ${C.BORDER}`, background: 'transparent',
    cursor: 'pointer', color: C.MUTED, fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: font,
  },
  stepsBar: {
    display: 'flex', borderBottom: `1px solid ${C.BORDER}`,
    padding: '0 28px', background: C.SECONDARY,
  },
  stepTab: (active, done) => ({
    padding: '13px 18px 11px',
    borderBottom: active ? `2.5px solid ${C.PRIMARY}` : '2.5px solid transparent',
    marginBottom: '-1px',
    color: active ? C.PRIMARY : done ? C.MUTED : '#aab5ab',
    fontSize: '13px', fontWeight: active ? 700 : 500,
    cursor: 'pointer', userSelect: 'none',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'color .15s', whiteSpace: 'nowrap',
  }),
  stepNum: (active, done) => ({
    width: 20, height: 20, borderRadius: '50%',
    background: done ? C.PRIMARY : active ? C.PRIMARY : '#c8d4c8',
    color: (done || active) ? C.TEXT_LIGHT : '#aab5ab',
    fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background .15s',
  }),
  body: { flex: 1, overflowY: 'auto', padding: '24px 28px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
    color: C.MUTED, textTransform: 'uppercase', marginBottom: '16px',
  },
  card: (highlight) => ({
    background: highlight ? '#f4f7f4' : C.SECONDARY,
    border: `1.5px solid ${highlight ? C.BORDER : 'transparent'}`,
    borderRadius: radius.md, padding: '18px 20px', marginBottom: '10px',
  }),
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '11.5px', fontWeight: 600, color: C.MUTED, marginBottom: '5px', letterSpacing: '0.2px' },
  input: (err) => ({
    padding: '9px 12px', borderRadius: radius.sm,
    border: `1.5px solid ${err ? C.ERROR : C.BORDER}`,
    background: err ? '#fff5f5' : C.SURFACE,
    fontSize: '13.5px', color: C.TEXT_DARK,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: font,
  }),
  select: (err) => ({
    padding: '9px 12px', borderRadius: radius.sm,
    border: `1.5px solid ${err ? C.ERROR : C.BORDER}`,
    background: err ? '#fff5f5' : C.SURFACE,
    fontSize: '13.5px', color: C.TEXT_DARK,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: font, cursor: 'pointer', appearance: 'none',
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  grid5: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px' },
  switchTrack: (on) => ({
    width: 38, height: 20, borderRadius: '10px',
    background: on ? C.PRIMARY : '#c8d4c8',
    display: 'flex', alignItems: 'center', padding: '2px',
    cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
  }),
  switchThumb: (on) => ({
    width: 16, height: 16, borderRadius: '50%', background: C.TEXT_LIGHT,
    marginLeft: on ? '18px' : '0px', transition: 'margin .2s',
    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
  }),
  divider: { borderTop: `1px solid ${C.BORDER}`, margin: '16px 0' },
  errorBanner: {
    borderRadius: radius.sm, background: '#fff2f2',
    border: `1.5px solid ${C.ERROR}`, padding: '11px 16px',
    marginBottom: '16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '10px',
  },
  errorText: { fontSize: '13px', color: C.ERROR, fontWeight: 500 },
  footer: {
    padding: '16px 28px', borderTop: `1px solid ${C.BORDER}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: C.SURFACE, gap: '10px',
  },
  btnOutline: {
    padding: '9px 20px', borderRadius: radius.sm,
    border: `1.5px solid ${C.BORDER}`, background: C.SURFACE,
    color: C.TEXT_DARK, fontSize: '13.5px', fontWeight: 600,
    cursor: 'pointer', fontFamily: font,
  },
  btnSecondary: {
    padding: '9px 20px', borderRadius: radius.sm,
    border: `1.5px solid ${C.PRIMARY}`, background: 'transparent',
    color: C.PRIMARY, fontSize: '13.5px', fontWeight: 600,
    cursor: 'pointer', fontFamily: font,
  },
  btnPrimary: (disabled) => ({
    padding: '9px 22px', borderRadius: radius.sm, border: 'none',
    background: disabled ? '#b8c4b8' : C.PRIMARY,
    color: C.TEXT_LIGHT, fontSize: '13.5px', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: font,
  }),
  summaryRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '13.5px', padding: '8px 0', borderBottom: `1px solid ${C.SECONDARY}`,
  },
  summaryLabel: { color: C.MUTED, fontWeight: 500 },
  summaryVal:   { color: C.TEXT_DARK, fontWeight: 600 },
};

/* ─── Helpers ─── */
const generateInitialAssignments = (booking) => {
  if (!booking?.roomDetails) return [];
  return booking.roomDetails.flatMap((detail, di) =>
    Array.from({ length: detail.quantity }, (_, i) => ({
      id: `${detail.roomTypeName}-${di}-${i}`,
      roomTypeName: detail.roomTypeName,
      newRoomTypeName: null,
      selectedRoomId: '',
      guestName: di === 0 && i === 0 ? booking.guestName : '',
      identityNumber: '',
      phone: '', email: '', dateOfBirth: '',
      nationality: 'VN', gender: '',
      showExtra: false,
      showTypeChange: false,
      upgradeFee: '', upgradeReason: '',
      upgradePayNow: false, upgradePaymentMethod: 'CASH',
    }))
  );
};

function Field({ label, children }) {
  return <div style={S.field}><label style={S.label}>{label}</label>{children}</div>;
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div style={S.switchTrack(on)} onClick={() => !disabled && onChange(!on)}>
      <div style={S.switchThumb(on)} />
    </div>
  );
}

function PaymentOption({ value, onChange, isSubmitting }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {[
        { val: false, label: 'Pay Later', sub: 'Roll into checkout bill' },
        { val: true,  label: 'Pay Now',   sub: 'Collect at counter immediately' },
      ].map(opt => (
        <div key={String(opt.val)}
          onClick={() => !isSubmitting && onChange(opt.val)}
          style={{
            flex: 1, padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
            border: `2px solid ${value === opt.val ? C.PRIMARY : C.BORDER}`,
            background: value === opt.val ? '#f0f5f0' : C.SURFACE,
            transition: 'all .15s',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid ${value === opt.val ? C.PRIMARY : C.BORDER}`,
              background: value === opt.val ? C.PRIMARY : 'transparent',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: value === opt.val ? C.PRIMARY : C.TEXT_DARK }}>{opt.label}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: C.MUTED, marginTop: '3px', marginLeft: '22px' }}>{opt.sub}</div>
        </div>
      ))}
    </div>
  );
}

function PaymentMethodSelect({ value, onChange, disabled }) {
  return (
    <Field label="Payment Method">
      <select style={S.select(false)} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="CASH">Cash</option>
        <option value="CARD">Card</option>
        <option value="TRANSFER">Bank Transfer</option>
      </select>
    </Field>
  );
}

/* ── Step 1: Arrival Info ── */
function StepArrival({
  applyEarlyCheckIn, setApplyEarlyCheckIn,
  earlyCheckInFee, setEarlyCheckInFee,
  earlyCheckInTime, setEarlyCheckInTime,
  earlyCheckInNote, setEarlyCheckInNote,
  luggageNote, setLuggageNote,
  payNow, setPayNow,
  paymentMethod, setPaymentMethod,
  isSubmitting,
}) {
  return (
    <div>
      <p style={S.sectionLabel}>Fill in arrival context before assigning rooms</p>

      {/* ── Early Check-in Surcharge ── */}
      <div style={S.card(applyEarlyCheckIn)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: applyEarlyCheckIn ? '16px' : 0 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.TEXT_DARK }}>Early Check-in Surcharge</div>
            <div style={{ fontSize: '12.5px', color: C.MUTED, marginTop: '2px' }}>Apply if guest is checking in before standard time</div>
          </div>
          <Toggle on={applyEarlyCheckIn} onChange={setApplyEarlyCheckIn} disabled={isSubmitting} />
        </div>
        {applyEarlyCheckIn && (
          <>
            <div style={S.grid2}>
              <Field label="Amount (VND)">
                <input style={S.input(false)} type="number" value={earlyCheckInFee}
                  onChange={e => setEarlyCheckInFee(e.target.value)} placeholder="e.g. 500000" disabled={isSubmitting} />
              </Field>
              <Field label="Check-in Time & Note">
                <div style={{ display: 'flex', border: `1.5px solid ${C.BORDER}`, borderRadius: radius.sm, background: C.SURFACE, overflow: 'hidden' }}>
                  <span style={{ padding: '9px 12px', background: '#f8f9fa', color: C.MUTED, fontSize: '13.5px', borderRight: `1px solid ${C.BORDER}`, whiteSpace: 'nowrap' }}>
                    Early check-in at
                  </span>
                  <input style={{ ...S.input(false), border: 'none', borderRadius: 0, width: '90px', borderRight: `1px solid ${C.BORDER}`, paddingRight: '8px' }}
                    value={earlyCheckInTime} onChange={e => setEarlyCheckInTime(e.target.value)} disabled={isSubmitting} />
                  <input style={{ ...S.input(false), border: 'none', borderRadius: 0, flex: 1, minWidth: 0 }}
                    value={earlyCheckInNote} onChange={e => setEarlyCheckInNote(e.target.value)} placeholder="Extra note..." disabled={isSubmitting} />
                </div>
              </Field>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${C.BORDER}` }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: C.MUTED, marginBottom: '10px', letterSpacing: '0.2px' }}>PAYMENT OPTION</div>
              <PaymentOption value={payNow} onChange={setPayNow} isSubmitting={isSubmitting} />
              {payNow && (
                <div style={{ marginTop: '12px' }}>
                  <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} disabled={isSubmitting} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div style={S.divider} />

      {/* ── Luggage ── */}
      <div style={S.card(!!luggageNote)}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.TEXT_DARK, marginBottom: '4px' }}>Pre-arrival Luggage Storage</div>
        <div style={{ fontSize: '12.5px', color: C.MUTED, marginBottom: '12px' }}>
          If the room is not ready, record luggage here and click <strong style={{ color: C.PRIMARY }}>Mark Arrived</strong> below — no room assignment needed yet.
        </div>
        <Field label="Luggage Description">
          <input style={S.input(false)} value={luggageNote}
            onChange={e => setLuggageNote(e.target.value)}
            placeholder="e.g. 2 large red suitcases, Tag #45" disabled={isSubmitting} />
        </Field>
      </div>
    </div>
  );
}

/* ── Step 2: Room Assignment ── */
function StepRooms({ assignments, availableRooms, errorMessage, isSubmitting, onChange }) {
  const hasErr = !!errorMessage;
  const allRoomTypeNames = Object.keys(availableRooms || {});

  const takenByIndex = (currentIndex) =>
    new Set(
      assignments
        .filter((a, i) => i !== currentIndex && a.selectedRoomId)
        .map(a => a.selectedRoomId)
    );

  return (
    <div>
      <p style={S.sectionLabel}>Assign a physical room and register each guest</p>
      {assignments.map((assign, index) => {
        const currentTypeName = assign.newRoomTypeName || assign.roomTypeName;
        const rooms = availableRooms[currentTypeName];
        const taken = takenByIndex(index);
        const filteredRooms = rooms ? rooms.filter(r => !taken.has(r.id)) : [];
        const noRoom = !filteredRooms || filteredRooms.length === 0;
        const wasUpgraded = assign.newRoomTypeName && assign.newRoomTypeName !== assign.roomTypeName;

        return (
          <div key={assign.id} style={S.card(!noRoom && !!assign.selectedRoomId)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '7px', background: C.PRIMARY, color: C.TEXT_LIGHT, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {index + 1}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: wasUpgraded ? C.PRIMARY : C.TEXT_DARK }}>
                  {currentTypeName}
                </span>
                {wasUpgraded && (
                  <span style={{ fontSize: '11px', color: C.SURFACE, fontWeight: 600, background: C.PRIMARY, padding: '2px 8px', borderRadius: '20px' }}>
                    Changed from {assign.roomTypeName}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  style={{ fontSize: '12px', color: C.PRIMARY, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: font }}
                  onClick={() => onChange(index, 'showTypeChange', !assign.showTypeChange)}
                  disabled={isSubmitting}>
                  {assign.showTypeChange ? '✕ Cancel change' : '↔ Change type'}
                </button>
                <button
                  style={{ fontSize: '12px', color: C.MUTED, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, fontFamily: font }}
                  onClick={() => onChange(index, 'showExtra', !assign.showExtra)}
                  disabled={isSubmitting}>
                  {assign.showExtra ? 'Hide extra' : '+ Extra info'}
                </button>
              </div>
            </div>

            {/* Per-slot room type change + surcharge */}
            {assign.showTypeChange && (
              <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '8px', background: '#f0f5f0', border: `1px dashed ${C.PRIMARY}` }}>
                <Field label={`Change from ${assign.roomTypeName} to:`}>
                  <select
                    style={{ ...S.select(false), border: `1.5px solid ${C.PRIMARY}` }}
                    value={assign.newRoomTypeName || ''}
                    onChange={e => {
                      const newType = e.target.value || null;
                      onChange(index, 'newRoomTypeName', newType);
                      onChange(index, 'selectedRoomId', '');
                      if (!newType) {
                        onChange(index, 'upgradeFee', '');
                        onChange(index, 'upgradeReason', '');
                        onChange(index, 'upgradePayNow', false);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Keep original ({assign.roomTypeName}) --</option>
                    {allRoomTypeNames
                      .filter(name => name !== assign.roomTypeName)
                      .map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                  </select>
                </Field>

                {/* Surcharge fields — only when a new type is selected */}
                {assign.newRoomTypeName && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.BORDER}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: C.MUTED, marginBottom: '8px' }}>SURCHARGE (optional)</div>
                    <div style={S.grid2}>
                      <Field label="Fee (VND)">
                        <input style={S.input(false)} type="number" value={assign.upgradeFee}
                          onChange={e => onChange(index, 'upgradeFee', e.target.value)}
                          placeholder="0 = Free" disabled={isSubmitting} />
                      </Field>
                      <Field label="Reason">
                        <input style={S.input(false)} value={assign.upgradeReason}
                          onChange={e => onChange(index, 'upgradeReason', e.target.value)}
                          placeholder={`e.g. ${assign.roomTypeName} → ${assign.newRoomTypeName}`} disabled={isSubmitting} />
                      </Field>
                    </div>
                    {Number(assign.upgradeFee) > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <PaymentOption value={assign.upgradePayNow} onChange={v => onChange(index, 'upgradePayNow', v)} isSubmitting={isSubmitting} />
                        {assign.upgradePayNow && (
                          <div style={{ marginTop: '8px' }}>
                            <PaymentMethodSelect value={assign.upgradePaymentMethod} onChange={v => onChange(index, 'upgradePaymentMethod', v)} disabled={isSubmitting} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={S.grid3}>
              <Field label="Assign Room">
                {noRoom
                  ? <div style={{ fontSize: '13px', color: C.ERROR, fontWeight: 600, padding: '9px 0' }}>No clean rooms available</div>
                  : <select style={S.select(hasErr && !assign.selectedRoomId)} value={assign.selectedRoomId}
                      onChange={e => onChange(index, 'selectedRoomId', Number(e.target.value))} disabled={isSubmitting}>
                      <option value="">Select room</option>
                      {filteredRooms.map(r => <option key={r.id} value={r.id}>Room {r.name}</option>)}
                    </select>
                }
              </Field>
              <Field label="Primary Guest Name *">
                <input style={S.input(hasErr && !assign.guestName)} value={assign.guestName}
                  placeholder="Full name" onChange={e => onChange(index, 'guestName', e.target.value)} disabled={isSubmitting} />
              </Field>
              <Field label="ID / Passport *">
                <input style={S.input(hasErr && !assign.identityNumber)} value={assign.identityNumber}
                  placeholder="Document number" onChange={e => onChange(index, 'identityNumber', e.target.value)} disabled={isSubmitting} />
              </Field>
            </div>

            {assign.showExtra && (
              <div style={{ ...S.grid5, marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.BORDER}` }}>
                <Field label="Phone"><input style={S.input(false)} value={assign.phone} onChange={e => onChange(index, 'phone', e.target.value)} disabled={isSubmitting} /></Field>
                <Field label="Email"><input style={S.input(false)} value={assign.email} onChange={e => onChange(index, 'email', e.target.value)} disabled={isSubmitting} /></Field>
                <Field label="Date of Birth"><input type="date" style={S.input(false)} value={assign.dateOfBirth} onChange={e => onChange(index, 'dateOfBirth', e.target.value)} disabled={isSubmitting} /></Field>
                <Field label="Gender">
                  <select style={S.select(false)} value={assign.gender} onChange={e => onChange(index, 'gender', e.target.value)} disabled={isSubmitting}>
                    <option value="">--</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </Field>
                <Field label="Nationality"><input style={S.input(false)} value={assign.nationality} onChange={e => onChange(index, 'nationality', e.target.value)} disabled={isSubmitting} /></Field>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 2.5: Fee Allocation ── */
function StepAllocation({ assignments, earlyCheckInFee, allocationMode, setAllocationMode, allocationRoomIndex, setAllocationRoomIndex, isSubmitting }) {
  const feeNumber = Number(earlyCheckInFee || 0);
  const perRoomFee = feeNumber / assignments.length;
  
  return (
    <div>
      <p style={S.sectionLabel}>Choose how to split the Early Check-in Surcharge</p>
      <div style={S.card(true)}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {[
            { mode: 'EVEN', label: 'Split Evenly', desc: 'Divide fee across all rooms' },
            { mode: 'SINGLE', label: 'Assign to One Room', desc: 'Add fee to a specific room' }
          ].map(opt => (
            <label key={opt.mode} style={{ 
              flex: 1, display: 'flex', alignItems: 'flex-start', gap: '10px', 
              padding: '14px', borderRadius: '8px', cursor: 'pointer',
              border: `2px solid ${allocationMode === opt.mode ? C.PRIMARY : C.BORDER}`,
              background: allocationMode === opt.mode ? '#f0f5f0' : C.SURFACE
            }}>
              <input type="radio" name="allocationMode" value={opt.mode} 
                checked={allocationMode === opt.mode} 
                onChange={() => !isSubmitting && setAllocationMode(opt.mode)}
                disabled={isSubmitting}
                style={{ marginTop: '2px', accentColor: C.PRIMARY }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: allocationMode === opt.mode ? C.PRIMARY : C.TEXT_DARK }}>{opt.label}</div>
                <div style={{ fontSize: '11.5px', color: C.MUTED, marginTop: '2px' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${C.BORDER}`, paddingTop: '16px' }}>
          {allocationMode === 'EVEN' ? (
            <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '6px', fontSize: '13px', color: C.TEXT_DARK }}>
              Fee per room: <strong style={{ color: C.PRIMARY }}>{perRoomFee.toLocaleString(undefined, { maximumFractionDigits: 0 })} VND</strong> (across {assignments.length} rooms)
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: C.MUTED, marginBottom: '10px' }}>SELECT TARGET ROOM</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {assignments.map((a, i) => (
                  <label key={a.id} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '6px', cursor: 'pointer',
                    background: allocationRoomIndex === i ? C.PRIMARY : C.SURFACE,
                    color: allocationRoomIndex === i ? C.TEXT_LIGHT : C.TEXT_DARK,
                    border: `1px solid ${allocationRoomIndex === i ? C.PRIMARY : C.BORDER}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="radio" name="targetRoom" value={i} 
                        checked={allocationRoomIndex === i}
                        onChange={() => !isSubmitting && setAllocationRoomIndex(i)}
                        disabled={isSubmitting}
                        style={{ accentColor: allocationRoomIndex === i ? C.TEXT_LIGHT : C.PRIMARY }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          Room Name/ID: {a.selectedRoomId} <span style={{ fontWeight: 400, opacity: 0.8 }}>({a.newRoomTypeName || a.roomTypeName})</span>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                          Guest: {a.guestName || 'Unnamed'}
                        </div>
                      </div>
                    </div>
                    {allocationRoomIndex === i && (
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>+{feeNumber.toLocaleString()} VND</div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepConfirm({ booking, assignments, applyEarlyCheckIn, earlyCheckInFee, earlyCheckInTime, earlyCheckInNote, luggageNote, payNow, paymentMethod, allocationMode, allocationRoomIndex }) {
  const pill = { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, background: '#e8ede8', color: C.PRIMARY, marginLeft: '8px' };
  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Bank Transfer' : 'Cash';
  return (
    <div>
      <p style={S.sectionLabel}>Review all details before confirming</p>

      <div style={{ ...S.card(true), marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: C.MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>Booking</div>
        <div style={S.summaryRow}><span style={S.summaryLabel}>Booking Code</span><span style={S.summaryVal}>{booking.bookingCode}</span></div>
        <div style={S.summaryRow}><span style={S.summaryLabel}>Booker</span><span style={S.summaryVal}>{booking.guestName}</span></div>

        {applyEarlyCheckIn && (
          <>
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>Early Check-in Fee</span>
              <span style={{...S.summaryVal, textAlign: 'right'}}>
                {Number(earlyCheckInFee || 0).toLocaleString()} VND
                {assignments.length > 1 && (
                  <div style={{ fontSize: '11.5px', color: C.PRIMARY, fontWeight: 500, marginTop: '2px' }}>
                    {allocationMode === 'EVEN' ? 'Split evenly across all rooms' : `Assigned to Room ${assignments[allocationRoomIndex]?.selectedRoomId}`}
                  </div>
                )}
                {earlyCheckInTime && <div style={{ fontWeight: 400, color: C.MUTED, fontSize: '12px', marginTop: '2px' }}>&mdash; Early check-in at {earlyCheckInTime}{earlyCheckInNote ? ` - ${earlyCheckInNote}` : ''}</div>}
              </span>
            </div>
            <div style={{ ...S.summaryRow, borderBottom: 'none' }}>
              <span style={S.summaryLabel}>Payment</span>
              <span style={{ ...S.summaryVal, color: payNow ? '#1a7a3c' : '#b07800', background: payNow ? '#eaf5ee' : '#fdf5e0', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                {payNow ? `✓ Paid (${methodLabel(paymentMethod)})` : '⏳ Pay at checkout'}
              </span>
            </div>
          </>
        )}

        {luggageNote && (
          <div style={{ ...S.summaryRow, borderBottom: 'none' }}>
            <span style={S.summaryLabel}>Luggage</span>
            <span style={{ ...S.summaryVal, maxWidth: '55%', textAlign: 'right' }}>{luggageNote}</span>
          </div>
        )}
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: C.MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>
        Room Assignments ({assignments.length})
      </div>
      {assignments.map((a, i) => {
        const displayType = a.newRoomTypeName || a.roomTypeName;
        const changed = a.newRoomTypeName && a.newRoomTypeName !== a.roomTypeName;
        return (
          <div key={a.id} style={{ ...S.card(!!a.selectedRoomId), marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ width: 22, height: 22, borderRadius: '6px', background: C.PRIMARY, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                <span style={{ fontWeight: 700, color: C.TEXT_DARK, fontSize: '14px' }}>
                  {a.guestName || <span style={{ color: C.MUTED, fontStyle: 'italic' }}>No name</span>}
                </span>
                <span style={pill}>{displayType}</span>
                {changed && <span style={{ ...pill, background: C.PRIMARY, color: C.SURFACE }}>{a.roomTypeName} → {a.newRoomTypeName}</span>}
              </div>
              <span style={{ fontSize: '12.5px', color: a.selectedRoomId ? C.PRIMARY : C.ERROR, fontWeight: 600 }}>
                {a.selectedRoomId ? 'Room assigned' : 'No room selected'}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: C.MUTED, marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {a.identityNumber && <span>ID: {a.identityNumber}</span>}
              {a.phone && <span>Phone: {a.phone}</span>}
              {a.email && <span>Email: {a.email}</span>}
              {changed && Number(a.upgradeFee) > 0 && (
                <span style={{ color: C.PRIMARY, fontWeight: 600 }}>
                  Fee: {Number(a.upgradeFee).toLocaleString()} VND ({a.upgradePayNow ? `Paid - ${methodLabel(a.upgradePaymentMethod)}` : 'Pay later'})
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main ─── */
export default function CheckInModal({ show, onClose, booking, branchId, onSuccess }) {
  const [step, setStep] = useState(0);
  const [assignments, setAssignments] = useState(() => generateInitialAssignments(booking));
  const [availableRooms, setAvailableRooms] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalAvailableRooms = Object.values(availableRooms).reduce((sum, arr) => sum + arr.length, 0);
  const totalRequestedRooms = booking?.roomDetails?.reduce((sum, rd) => sum + rd.quantity, 0) || 1; // fallback 1
  const isShortage = totalAvailableRooms < totalRequestedRooms;
  
  // Check if booking check-in date is today
  let isNotToday = false;
  if (booking?.checkIn) {
    const [d, m, y] = booking.checkIn.split('/');
    const checkInDate = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    isNotToday = checkInDate.getTime() !== today.getTime();
  }

  // Disable Room Assignment if shortages or not today
  const canAssignRooms = !isShortage && !isNotToday;

  // Early check-in
  const [applyEarlyCheckIn, setApplyEarlyCheckIn] = useState(false);
  const [earlyCheckInFee, setEarlyCheckInFee] = useState('');
  const [earlyCheckInTime, setEarlyCheckInTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [earlyCheckInNote, setEarlyCheckInNote] = useState('');
  const [luggageNote, setLuggageNote] = useState(booking?.luggageNote || '');
  const [payNow, setPayNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  const [allocationMode, setAllocationMode] = useState('EVEN');
  const [allocationRoomIndex, setAllocationRoomIndex] = useState(0);

  const [isMarkingArrived, setIsMarkingArrived] = useState(false);

  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState('CASH');
  
  const [localAmountDue, setLocalAmountDue] = useState(() => {
    return (booking && booking.totalAmount && booking.prepaidAmount != null)
      ? Math.max(0, Number(booking.totalAmount) - Number(booking.prepaidAmount))
      : 0;
  });
  const hasUnpaidBalance = localAmountDue > 0;

  const showAllocationStep = applyEarlyCheckIn && Number(earlyCheckInFee || 0) > 0 && assignments.length > 1;
  const baseSteps = showAllocationStep 
    ? ['Arrival Info', 'Room Assignment', 'Fee Allocation', 'Confirm']
    : ['Arrival Info', 'Room Assignment', 'Confirm'];
    
  const currentSteps = hasUnpaidBalance ? ['Collect Deposit', ...baseSteps] : baseSteps;
  
  const currentStepName = currentSteps[step];
  const isDepositStep = currentStepName === 'Collect Deposit';
  const isArrivalStep = currentStepName === 'Arrival Info';
  const isAssignStep = currentStepName === 'Room Assignment';
  const isAllocStep = currentStepName === 'Fee Allocation';
  const isConfirmStep = currentStepName === 'Confirm';

  useEffect(() => {
    if (!show || !branchId) return;
    checkInApi.getAvailableRooms(branchId)
      .then(setAvailableRooms)
      .catch(() => setErrorMessage('Failed to load available rooms.'));
  }, [show, branchId]);

  const handleChange = (index, field, value) => {
    setAssignments(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
    if (errorMessage) setErrorMessage('');
  };

  // Mark guest as ARRIVED (luggage stored, room not ready yet)
  const handleMarkArrived = async () => {
    setIsMarkingArrived(true);
    setErrorMessage('');
    try {
      await checkInApi.markAsArrived(booking.id, luggageNote);
      Swal.fire({ icon: 'success', title: 'Arrived!', text: 'Guest has been marked as Arrived. Room can be assigned later.', timer: 2000, showConfirmButton: false });
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to mark as arrived.');
    } finally {
      setIsMarkingArrived(false);
    }
  };

  const handleSubmitCheckIn = async () => {
    setErrorMessage('');
    if (assignments.some(a => !a.selectedRoomId || !a.guestName || !a.identityNumber)) {
      setErrorMessage('Please select a room, enter Guest Name and ID for all assignments.');
      setStep(1); return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        assignments: assignments.map(a => ({
          ...a,
          dateOfBirth: a.dateOfBirth || null,
          newRoomTypeName: a.newRoomTypeName || null,
          // Per-room upgrade surcharge
          upgradeFee: a.newRoomTypeName && Number(a.upgradeFee) > 0 ? Number(a.upgradeFee) : null,
          upgradeReason: a.newRoomTypeName ? (a.upgradeReason || `${a.roomTypeName} → ${a.newRoomTypeName}`) : null,
          upgradePayNow: a.newRoomTypeName ? a.upgradePayNow : false,
          upgradePaymentMethod: a.newRoomTypeName && a.upgradePayNow ? a.upgradePaymentMethod : null,
        })),
        earlyCheckInFee: applyEarlyCheckIn && earlyCheckInFee ? Number(earlyCheckInFee) : 0,
        earlyCheckInNote: applyEarlyCheckIn ? `Early check-in at ${earlyCheckInTime}${earlyCheckInNote ? ' - ' + earlyCheckInNote : ''}`.trim() : '',
        earlyCheckInAllocationMode: showAllocationStep ? allocationMode : 'EVEN',
        earlyCheckInTargetRoomIndex: showAllocationStep ? allocationRoomIndex : 0,
        payNow: applyEarlyCheckIn ? payNow : false,
        paymentMethod: applyEarlyCheckIn && payNow ? paymentMethod : null,
      };
      console.log('=== CHECK-IN FE DEBUG LOG ===');
      console.log('Booking Data:', booking);
      console.log('Payload Sent to checkInApi:', payload);

      await checkInApi.processCheckIn(booking.id, payload);
      Swal.fire({ icon: 'success', title: 'Check-in Complete!', text: 'Guest has been successfully checked in.', timer: 2000, showConfirmButton: false });
      onSuccess(); onClose();
    } catch (err) {
      console.error('=== CHECK-IN ERROR LOG ===', err);
      const errorMsg = err.response?.data?.error || 'A system error occurred.';
      Swal.fire({
        icon: 'error',
        title: 'Check-in Failed',
        text: errorMsg,
      });
      setErrorMessage(errorMsg);
    } finally { setIsSubmitting(false); }
  };

  const handlePayDeposit = async () => {
    setErrorMessage('');
    if (!remainingPaymentMethod) {
      setErrorMessage('Please select a payment method.');
      return;
    }
    setIsSubmitting(true);
    try {
      await checkInApi.payDepositBalance(booking.id, remainingPaymentMethod);
      Swal.fire({ icon: 'success', title: 'Payment Confirmed', text: 'Deposit balance recorded. You may now assign rooms.', timer: 2000, showConfirmButton: false });
      setLocalAmountDue(0);
      // Auto transitions since 'Collect Deposit' is removed from currentSteps, meaning step 0 becomes 'Arrival Info'.
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show || !booking) return null;

  const canGoBack = step > 0;

  return (
    <div style={S.overlay}>
      <div style={S.shell}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h2 style={S.headerTitle}>Check-in — {booking.bookingCode}</h2>
            <p style={S.headerSub}>{booking.guestName} &nbsp;·&nbsp; {booking.checkIn} → {booking.checkOut} &nbsp;·&nbsp; {booking.nights} night{booking.nights !== 1 ? 's' : ''}</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Steps bar */}
        <div style={S.stepsBar}>
          {currentSteps.map((label, i) => (
            <div key={i} style={S.stepTab(i === step, i < step)} onClick={() => i < step && setStep(i)}>
              <div style={S.stepNum(i === step, i < step)}>{i < step ? '✓' : i + 1}</div>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={S.body}>
          {errorMessage && (
            <div style={S.errorBanner}>
              <span style={S.errorText}>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.ERROR, fontSize: '13px', padding: 0, fontFamily: font }}>Dismiss</button>
            </div>
          )}

          {isDepositStep && (
            <div style={{ padding: '20px 0' }}>
              <div style={{
                background: '#fff8e1', border: '1.5px solid #f59e0b',
                borderRadius: '10px', padding: '16px 18px', marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>💰</span>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400e' }}>Remaining Balance Due</div>
                      <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                        Guest paid a partial deposit — remainder must be collected at check-in
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Due</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400e' }}>
                      {localAmountDue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #fcd34d', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    PAYMENT METHOD
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px',
                    border: '2px solid #f59e0b', background: '#fef3c7', marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '12.5px', color: '#92400e', marginBottom: '6px' }}>
                      ⚠️ <strong>Collection required before room assignment.</strong> Select payment method below.
                    </div>
                  </div>
                  <Field label="Payment Method for Remaining Balance">
                    <select
                      style={S.select(false)}
                      value={remainingPaymentMethod}
                      onChange={e => setRemainingPaymentMethod(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="TRANSFER">Bank Transfer</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {isArrivalStep && (
            <>

              {isNotToday && (
                <div style={{
                  background: '#ffebec', border: '1.5px solid #dc3545', borderRadius: '8px',
                  padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px'
                }}>
                  <i className="bi bi-x-circle-fill" style={{ color: '#dc3545', fontSize: '18px' }} />
                  <div>
                    <strong style={{ color: '#b71c1c', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Invalid Check-In Date</strong>
                    <div style={{ fontSize: '12.5px', color: '#555' }}>
                      This booking is scheduled for <strong>{booking?.checkIn}</strong>, not today. The system restricts room assignments to the correct arrival date.
                    </div>
                  </div>
                </div>
              )}
              {isShortage && !isNotToday && (
                <div style={{
                  background: '#fff4e5', border: '1.5px solid #ff9800', borderRadius: '8px',
                  padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px'
                }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ff9800', fontSize: '18px' }} />
                  <div>
                    <strong style={{ color: '#e65100', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Insufficient Rooms ({totalAvailableRooms} available)</strong>
                    <div style={{ fontSize: '12.5px', color: '#555' }}>
                      There are not enough clean rooms to early check in the entire booking ({totalRequestedRooms} rooms requested). Please save the luggage notation and click <strong>Mark Arrived</strong>.
                    </div>
                  </div>
                </div>
              )}
              <StepArrival
                applyEarlyCheckIn={applyEarlyCheckIn} setApplyEarlyCheckIn={setApplyEarlyCheckIn}
                earlyCheckInFee={earlyCheckInFee} setEarlyCheckInFee={setEarlyCheckInFee}
                earlyCheckInTime={earlyCheckInTime} setEarlyCheckInTime={setEarlyCheckInTime}
                earlyCheckInNote={earlyCheckInNote} setEarlyCheckInNote={setEarlyCheckInNote}
                luggageNote={luggageNote} setLuggageNote={setLuggageNote}
                payNow={payNow} setPayNow={setPayNow}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                isSubmitting={isSubmitting || isShortage || isNotToday} // Disable toggle if shortage or wrong day
              />
            </>
          )}

          {isAssignStep && (
            <StepRooms
              assignments={assignments}
              availableRooms={availableRooms}
              errorMessage={errorMessage}
              isSubmitting={isSubmitting}
              onChange={handleChange}
            />
          )}

          {isAllocStep && (
            <StepAllocation
              assignments={assignments}
              earlyCheckInFee={earlyCheckInFee}
              allocationMode={allocationMode}
              setAllocationMode={setAllocationMode}
              allocationRoomIndex={allocationRoomIndex}
              setAllocationRoomIndex={setAllocationRoomIndex}
              isSubmitting={isSubmitting}
            />
          )}

          {isConfirmStep && (
            <StepConfirm
              booking={booking}
              assignments={assignments}
              applyEarlyCheckIn={applyEarlyCheckIn}
              earlyCheckInFee={earlyCheckInFee}
              earlyCheckInTime={earlyCheckInTime}
              earlyCheckInNote={earlyCheckInNote}
              luggageNote={luggageNote}
              payNow={payNow}
              paymentMethod={paymentMethod}
              allocationMode={allocationMode}
              allocationRoomIndex={allocationRoomIndex}
            />
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canGoBack && (
              <button style={S.btnOutline} onClick={() => setStep(s => s - 1)} disabled={isSubmitting || isMarkingArrived}>Back</button>
            )}
            {/* Mark Arrived: only shown at Arrival Info step — when the room is not ready yet */}
            {isArrivalStep && (
              <button
                style={{
                  ...S.btnSecondary,
                  opacity: (isSubmitting || isMarkingArrived) ? 0.6 : 1,
                  cursor: (isSubmitting || isMarkingArrived) ? 'not-allowed' : 'pointer',
                }}
                onClick={handleMarkArrived}
                disabled={isSubmitting || isMarkingArrived}
                title="Record luggage and mark guest as Arrived — assign room later when ready"
              >
                {isMarkingArrived ? 'Marking...' : 'Mark Arrived'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={S.btnOutline} onClick={onClose} disabled={isSubmitting || isMarkingArrived}>Cancel</button>
            {isDepositStep ? (
               <button style={S.btnPrimary(isSubmitting)} onClick={handlePayDeposit} disabled={isSubmitting}>
                 {isSubmitting ? 'Processing...' : 'Confirm Payment & Continue ->'}
               </button>
            ) : isConfirmStep ? (
               <button style={S.btnPrimary(isSubmitting)} onClick={handleSubmitCheckIn} disabled={isSubmitting}>
                 {isSubmitting ? 'Processing...' : 'Confirm Check-in'}
               </button>
            ) : (
               <button style={S.btnPrimary(!canAssignRooms && isArrivalStep)}
                 onClick={() => setStep(step + 1)}
                 disabled={isMarkingArrived || (isArrivalStep && !canAssignRooms)}>  
                 Proceed to Next Step →
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}