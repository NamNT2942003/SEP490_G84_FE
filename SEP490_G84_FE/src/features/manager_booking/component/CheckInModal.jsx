import React, { useState, useEffect } from 'react';
import { checkInApi } from '../api/checkInApi';

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
      selectedRoomId: '',
      guestName: di === 0 && i === 0 ? booking.guestName : '',
      identityNumber: '',
      phone: '', email: '', dateOfBirth: '',
      nationality: 'VN', gender: '',
      showExtra: false,
    }))
  );
};

const STEPS = ['Arrival Info', 'Room Assignment', 'Confirm'];

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

/* ── Step 1: Arrival Info ── */
function StepArrival({ applyEarlyCheckIn, setApplyEarlyCheckIn, earlyCheckInFee, setEarlyCheckInFee, earlyCheckInNote, setEarlyCheckInNote, luggageNote, setLuggageNote, isSubmitting }) {
  return (
    <div>
      <p style={S.sectionLabel}>Fill in arrival context before assigning rooms</p>

      <div style={S.card(applyEarlyCheckIn)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: applyEarlyCheckIn ? '16px' : 0 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.TEXT_DARK }}>Early Check-in Surcharge</div>
            <div style={{ fontSize: '12.5px', color: C.MUTED, marginTop: '2px' }}>Apply if guest is checking in before standard time</div>
          </div>
          <Toggle on={applyEarlyCheckIn} onChange={setApplyEarlyCheckIn} disabled={isSubmitting} />
        </div>
        {applyEarlyCheckIn && (
          <div style={S.grid2}>
            <Field label="Amount (VND)">
              <input style={S.input(false)} type="number" value={earlyCheckInFee}
                onChange={e => setEarlyCheckInFee(e.target.value)} placeholder="e.g. 500000" disabled={isSubmitting} />
            </Field>
            <Field label="Reason / Invoice Note">
              <input style={S.input(false)} value={earlyCheckInNote}
                onChange={e => setEarlyCheckInNote(e.target.value)} placeholder="e.g. Early check-in at 08:00" disabled={isSubmitting} />
            </Field>
          </div>
        )}
      </div>

      <div style={S.divider} />

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
  return (
    <div>
      <p style={S.sectionLabel}>Assign a physical room and register each guest</p>
      {assignments.map((assign, index) => {
        const rooms  = availableRooms[assign.roomTypeName];
        const noRoom = !rooms || rooms.length === 0;
        return (
          <div key={assign.id} style={S.card(!noRoom && !!assign.selectedRoomId)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '7px', background: C.PRIMARY, color: C.TEXT_LIGHT, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {index + 1}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: C.TEXT_DARK }}>{assign.roomTypeName}</span>
              </div>
              <button style={{ fontSize: '12px', color: C.PRIMARY, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, fontFamily: font }}
                onClick={() => onChange(index, 'showExtra', !assign.showExtra)} disabled={isSubmitting}>
                {assign.showExtra ? 'Hide extra fields' : 'Add extra info'}
              </button>
            </div>

            <div style={S.grid3}>
              <Field label="Assign Room">
                {noRoom
                  ? <div style={{ fontSize: '13px', color: C.ERROR, fontWeight: 600, padding: '9px 0' }}>No clean rooms available</div>
                  : <select style={S.select(hasErr && !assign.selectedRoomId)} value={assign.selectedRoomId}
                      onChange={e => onChange(index, 'selectedRoomId', Number(e.target.value))} disabled={isSubmitting}>
                      <option value="">Select room</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>Room {r.name}</option>)}
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

/* ── Step 3: Confirm ── */
function StepConfirm({ booking, assignments, applyEarlyCheckIn, earlyCheckInFee, earlyCheckInNote, luggageNote }) {
  const pill = { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, background: '#e8ede8', color: C.PRIMARY, marginLeft: '8px' };
  return (
    <div>
      <p style={S.sectionLabel}>Review all details before confirming</p>

      <div style={{ ...S.card(true), marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: C.MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>Booking</div>
        <div style={S.summaryRow}><span style={S.summaryLabel}>Booking Code</span><span style={S.summaryVal}>{booking.bookingCode}</span></div>
        <div style={S.summaryRow}><span style={S.summaryLabel}>Booker</span><span style={S.summaryVal}>{booking.guestName}</span></div>
        {applyEarlyCheckIn && (
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Early Check-in Fee</span>
            <span style={S.summaryVal}>{Number(earlyCheckInFee || 0).toLocaleString()} VND{earlyCheckInNote && <> &mdash; <span style={{ fontWeight: 400, color: C.MUTED }}>{earlyCheckInNote}</span></>}</span>
          </div>
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
      {assignments.map((a, i) => (
        <div key={a.id} style={{ ...S.card(!!a.selectedRoomId), marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '6px', background: C.PRIMARY, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              <span style={{ fontWeight: 700, color: C.TEXT_DARK, fontSize: '14px' }}>{a.guestName || <span style={{ color: C.MUTED, fontStyle: 'italic' }}>No name</span>}</span>
              <span style={pill}>{a.roomTypeName}</span>
            </div>
            <span style={{ fontSize: '12.5px', color: a.selectedRoomId ? C.PRIMARY : C.ERROR, fontWeight: 600 }}>
              {a.selectedRoomId ? 'Room assigned' : 'No room selected'}
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: C.MUTED, marginTop: '6px', display: 'flex', gap: '16px' }}>
            {a.identityNumber && <span>ID: {a.identityNumber}</span>}
            {a.phone && <span>Phone: {a.phone}</span>}
            {a.email && <span>Email: {a.email}</span>}
          </div>
        </div>
      ))}
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
  const [applyEarlyCheckIn, setApplyEarlyCheckIn] = useState(false);
  const [earlyCheckInFee, setEarlyCheckInFee] = useState('');
  const [earlyCheckInNote, setEarlyCheckInNote] = useState('');
  const [luggageNote, setLuggageNote] = useState(booking?.luggageNote || '');

  useEffect(() => {
    if (!show || !branchId) return;
    checkInApi.getAvailableRooms(branchId).then(setAvailableRooms).catch(() => setErrorMessage('Failed to load available rooms.'));
  }, [show, branchId]);

  const handleChange = (index, field, value) => {
    setAssignments(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
    if (errorMessage) setErrorMessage('');
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
        assignments: assignments.map(a => ({ ...a, dateOfBirth: a.dateOfBirth || null })),
        earlyCheckInFee: applyEarlyCheckIn && earlyCheckInFee ? Number(earlyCheckInFee) : 0,
        earlyCheckInNote: applyEarlyCheckIn ? earlyCheckInNote : '',
      };
      await checkInApi.processCheckIn(booking.id, payload);
      alert('Check-in completed successfully!');
      onSuccess(); onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'A system error occurred.');
      setStep(2);
    } finally { setIsSubmitting(false); }
  };

  const handleMarkArrived = async () => {
    setIsSubmitting(true);
    try {
      await checkInApi.markAsArrived(booking.id, luggageNote);
      alert('Guest arrival recorded!');
      onSuccess(); onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to save arrival info.');
    } finally { setIsSubmitting(false); }
  };

  if (!show || !booking) return null;

  const hasMissingRooms = assignments.some(a => !availableRooms[a.roomTypeName]?.length);
  const stepDone = [true, assignments.every(a => a.selectedRoomId && a.guestName && a.identityNumber), false];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.overlay} onClick={e => e.target === e.currentTarget && !isSubmitting && onClose()}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <h5 style={S.headerTitle}>Check-In Process</h5>
              <p style={S.headerSub}>{booking.bookingCode} &middot; {booking.guestName}</p>
            </div>
            <button style={S.closeBtn} onClick={onClose} disabled={isSubmitting}>x</button>
          </div>

          <div style={S.stepsBar}>
            {STEPS.map((name, i) => (
              <div key={i} style={S.stepTab(step === i, stepDone[i])} onClick={() => setStep(i)}>
                <div style={S.stepNum(step === i, stepDone[i])}>
                  {stepDone[i] && i < step ? 'v' : i + 1}
                </div>
                {name}
              </div>
            ))}
          </div>

          <div style={S.body}>
            {errorMessage && (
              <div style={S.errorBanner}>
                <span style={S.errorText}>{errorMessage}</span>
                <button onClick={() => setErrorMessage('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.ERROR, fontSize: '13px', padding: 0, fontFamily: font }}>Dismiss</button>
              </div>
            )}
            {step === 0 && <StepArrival applyEarlyCheckIn={applyEarlyCheckIn} setApplyEarlyCheckIn={setApplyEarlyCheckIn} earlyCheckInFee={earlyCheckInFee} setEarlyCheckInFee={setEarlyCheckInFee} earlyCheckInNote={earlyCheckInNote} setEarlyCheckInNote={setEarlyCheckInNote} luggageNote={luggageNote} setLuggageNote={setLuggageNote} isSubmitting={isSubmitting} />}
            {step === 1 && <StepRooms assignments={assignments} availableRooms={availableRooms} errorMessage={errorMessage} isSubmitting={isSubmitting} onChange={handleChange} />}
            {step === 2 && <StepConfirm booking={booking} assignments={assignments} applyEarlyCheckIn={applyEarlyCheckIn} earlyCheckInFee={earlyCheckInFee} earlyCheckInNote={earlyCheckInNote} luggageNote={luggageNote} />}
          </div>

          <div style={S.footer}>
            <button style={S.btnOutline} onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {step > 0 && <button style={S.btnOutline} onClick={() => setStep(s => s - 1)} disabled={isSubmitting}>Back</button>}
              <button style={S.btnSecondary} onClick={handleMarkArrived} disabled={isSubmitting}>Mark Arrived</button>
              {step < STEPS.length - 1
                ? <button style={S.btnPrimary(false)} onClick={() => setStep(s => s + 1)}>Next</button>
                : <button style={S.btnPrimary(hasMissingRooms || isSubmitting)} onClick={handleSubmitCheckIn} disabled={hasMissingRooms || isSubmitting} title={hasMissingRooms ? 'No clean rooms available' : ''}>
                    {isSubmitting ? 'Processing...' : 'Confirm Check-In'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}