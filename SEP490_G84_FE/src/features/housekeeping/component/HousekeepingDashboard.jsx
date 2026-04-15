import React, { useState, useEffect } from 'react';
import { housekeepingApi } from '../api/housekeepingApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { COLORS } from '@/constants';
import Swal from 'sweetalert2';
import { IncidentManagerModal } from './IncidentManagerModal';

// ─── Color Palette ────────────────────────────────────────────────────────────
const P = {
  primary:     '#465c47',
  primaryDark: '#384a39',
  dirty:   { text: '#7d4e00', bg: '#fff8e1', border: '#ffe082', accent: '#f9a825' },
  occupied:{ text: '#1a237e', bg: '#f0f4ff', border: '#c5d8ff', accent: '#3949ab' },
  maint:   { text: '#bf360c', bg: '#fff8f3', border: '#ffccbc', accent: '#f4511e' },
  avail:   { text: '#1b5e20', bg: '#f0fff4', border: '#c8e6c9', accent: '#2e7d32' },
};

const getS = (s) => ({
  DIRTY:       { ...P.dirty,    label: 'Needs Cleaning', icon: 'bi-droplet-fill' },
  OCCUPIED:    { ...P.occupied, label: 'Occupied',       icon: 'bi-person-fill' },
  MAINTENANCE: { ...P.maint,    label: 'Maintenance',    icon: 'bi-tools' },
  AVAILABLE:   { ...P.avail,    label: 'Available',      icon: 'bi-check-circle-fill' },
}[s] || { ...P.avail, label: s, icon: 'bi-circle' });

// ─── Stat card config ─────────────────────────────────────────────────────────
const STAT_DEFS = [
  { key: 'ALL',         label: 'Total Rooms',     icon: 'bi-grid-fill',         iconBg: '#f0f0f0', iconColor: '#555'    },
  { key: 'AVAILABLE',   label: 'Available',        icon: 'bi-check-circle-fill', iconBg: '#e8f5e9', iconColor: '#2e7d32' },
  { key: 'OCCUPIED',    label: 'Occupied',         icon: 'bi-people-fill',       iconBg: '#e8eaf6', iconColor: '#3949ab' },
  { key: 'DIRTY',       label: 'Needs Cleaning',   icon: 'bi-droplet-fill',      iconBg: '#fff8e1', iconColor: '#f9a825' },
  { key: 'MAINTENANCE', label: 'Maintenance',      icon: 'bi-tools',             iconBg: '#fff3e0', iconColor: '#f4511e' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const HousekeepingDashboard = () => {
  const currentUser = useCurrentUser();
  const isAdmin   = currentUser?.permissions?.isAdmin;
  const isManager = currentUser?.permissions?.isManager;
  const canManage = isAdmin || isManager;

  const [rooms,                setRooms]                = useState([]);
  const [loading,              setLoading]              = useState(false);
  const [filter,               setFilter]               = useState(canManage ? 'ALL' : 'DIRTY');
  const [branches,             setBranches]             = useState([]);
  const [selectedBranch,       setSelectedBranch]       = useState(null);
  const [selectedIncidentRoom, setSelectedIncidentRoom] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    if (canManage) {
      housekeepingApi.getMyBranches()
        .then(res => {
          const data = res.data || [];
          setBranches(data);
          const def = data.find(b => b.branchId === currentUser.branchId) || data[0];
          setSelectedBranch(def ? def.branchId : currentUser.branchId);
        })
        .catch(() => setSelectedBranch(currentUser.branchId));
    } else {
      setSelectedBranch(currentUser.branchId);
    }
  }, [currentUser]);

  useEffect(() => { if (selectedBranch) fetchRooms(); }, [selectedBranch]);

  const fetchRooms = async () => {
    if (!selectedBranch) return;
    try {
      setLoading(true);
      const res = await housekeepingApi.getRooms(selectedBranch);
      setRooms(res.data || []);
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load rooms. Please try again.', confirmButtonColor: P.primary });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClean = async (roomId) => {
    const { value: note, isConfirmed } = await Swal.fire({
      title: 'Mark room as clean?',
      input: 'textarea',
      inputPlaceholder: 'Optional notes: changed bed sheets, mopped floor...',
      showCancelButton: true,
      confirmButtonText: 'Confirm — Done Cleaning',
      cancelButtonText: 'Cancel',
      confirmButtonColor: P.primary,
    });
    if (!isConfirmed) return;
    try {
      await housekeepingApi.updateRoomStatusToClean(roomId, { cleaningNote: note || '' });
      Swal.fire({ icon: 'success', title: 'Done!', timer: 1600, showConfirmButton: false });
      fetchRooms();
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update room status.', confirmButtonColor: P.primary });
    }
  };

  const handleReportIncident = async (roomId) => {
    const { value: description, isConfirmed } = await Swal.fire({
      title: '⚠️ Report an Incident',
      input: 'textarea',
      inputPlaceholder: 'Describe the issue: leaking faucet, AC not working...',
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      cancelButtonText: 'Cancel',
      confirmButtonColor: COLORS.ERROR,
      inputValidator: v => !v ? 'Please describe the incident.' : undefined,
    });
    if (!isConfirmed || !description) return;
    try {
      await housekeepingApi.reportIncident(roomId, { description });
      Swal.fire({ icon: 'success', title: 'Reported!', text: 'The manager has been notified.', timer: 1600, showConfirmButton: false });
      fetchRooms();
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to submit incident report.', confirmButtonColor: COLORS.ERROR });
    }
  };

  const handleRequestCleaning = async (room) => {
    const isOccupied = room.physicalStatus === 'OCCUPIED';
    const result = await Swal.fire({
      title: `Request cleaning for Room ${room.roomName}?`,
      html: isOccupied
        ? `<p>This room is currently <b>occupied</b>. A housekeeper will perform a service clean.</p>
           <p style="color:#888;font-size:13px">⚠️ The room will return to <b>Occupied</b> status after cleaning is done.</p>`
        : `<p>The room will be marked as <b>Needs Cleaning</b> for housekeeping staff.</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      confirmButtonColor: P.dirty.accent,
    });
    if (!result.isConfirmed) return;
    try {
      await housekeepingApi.requestCleaning(room.roomId);
      Swal.fire({ icon: 'success', title: 'Requested!', text: `Room ${room.roomName} has been queued for cleaning.`, timer: 1600, showConfirmButton: false });
      fetchRooms();
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update room status.', confirmButtonColor: COLORS.ERROR });
    }
  };

  // ── Derived ──
  const selectedBranchName = branches.find(b => b.branchId === selectedBranch)?.branchName || '';
  const counts = STAT_DEFS.reduce((acc, s) => {
    acc[s.key] = s.key === 'ALL' ? rooms.length : rooms.filter(r => r.physicalStatus === s.key).length;
    return acc;
  }, {});
  const filteredRooms = filter === 'ALL' ? rooms : rooms.filter(r => r.physicalStatus === filter);
  const roomsWithIncidents = rooms.filter(r => r.incidentCount > 0);

  const grouped = {};
  filteredRooms.forEach(r => {
    const f = r.floor ?? 0;
    if (!grouped[f]) grouped[f] = [];
    grouped[f].push(r);
  });
  const floors = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  const fmt = (s) => s ? new Date(s).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
    <div style={{ minHeight: '100vh', background: '#f4f6f4', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>

        {/* ══ Title row ══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: P.primaryDark, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-brush-fill" style={{ color: P.primary }} />
              Housekeeping Board
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
              {selectedBranchName || 'Branch'} · {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {canManage && branches.length > 0 && (
              <select
                id="select-housekeeping-branch"
                value={selectedBranch || ''}
                onChange={e => setSelectedBranch(Number(e.target.value))}
                style={{
                  padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 13, fontWeight: 600, background: '#fff', color: '#333',
                  cursor: 'pointer', minWidth: 165, outline: 'none',
                }}
              >
                {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
              </select>
            )}
            <button
              onClick={fetchRooms}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: '#fff', border: '1px solid #ddd',
                color: '#555', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = P.primary}
              onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
            >
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </div>
        </div>

        {/* ══ Stat Cards ═════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {STAT_DEFS.map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                flex: 1, minWidth: 120,
                background: '#fff',
                border: filter === s.key ? `2px solid ${s.iconColor || P.primary}` : '1.5px solid #e8ece8',
                borderRadius: 12, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', textAlign: 'left',
                boxShadow: filter === s.key ? `0 2px 10px ${s.iconColor}22` : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { if (filter !== s.key) e.currentTarget.style.borderColor = '#bbb'; }}
              onMouseOut={e => { if (filter !== s.key) e.currentTarget.style.borderColor = '#e8ece8'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: s.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${s.icon}`} style={{ fontSize: 17, color: s.iconColor }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: filter === s.key ? (s.iconColor || P.primary) : '#212121', lineHeight: 1.2 }}>
                  {counts[s.key]}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Incident Alert */}
        {canManage && roomsWithIncidents.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #ffccbc',
            borderLeft: `4px solid ${P.maint.accent}`, borderRadius: 10,
            padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 12,
            boxShadow: '0 1px 6px rgba(244,81,30,0.07)',
          }}>
            <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: 18, color: P.maint.accent, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 7px', fontWeight: 700, color: P.maint.text, fontSize: 13 }}>
                {roomsWithIncidents.length} room{roomsWithIncidents.length !== 1 ? 's' : ''} with unresolved incidents
              </p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {roomsWithIncidents.map(r => (
                  <button key={r.roomId} onClick={() => setSelectedIncidentRoom(r)}
                    style={{
                      background: P.maint.bg, border: `1px solid ${P.maint.border}`,
                      borderRadius: 6, padding: '4px 11px', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, color: P.maint.text,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#ffe0d0'}
                    onMouseOut={e => e.currentTarget.style.background = P.maint.bg}
                  >
                    <i className="bi bi-tools" /> Room {r.roomName} ({r.incidentCount})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ Content ════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner-border" role="status" style={{ color: P.primary, width: 36, height: 36 }} />
            <p style={{ marginTop: 14, color: '#888', fontSize: 13 }}>Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ background: '#fff', padding: '50px 40px', textAlign: 'center', borderRadius: 14, border: '1.5px dashed #cdd8cd' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <h4 style={{ color: P.primary, margin: 0, fontWeight: 700 }}>All rooms are clean!</h4>
            <p style={{ color: '#aaa', margin: '8px 0 0', fontSize: 14 }}>No rooms need attention right now.</p>
          </div>
        ) : (
          floors.map(floor => (
            <div key={floor} style={{ marginBottom: 28 }}>

              {/* Floor divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  background: `linear-gradient(135deg, ${P.primaryDark}, ${P.primary})`,
                  color: '#fff', borderRadius: 7, padding: '3px 13px',
                  fontWeight: 800, fontSize: 12, letterSpacing: '0.3px',
                }}>
                  Floor {floor}
                </div>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, #cdd8cd, transparent)' }} />
                <span style={{ fontSize: 12, color: '#bbb' }}>{grouped[floor].length} room{grouped[floor].length !== 1 ? 's' : ''}</span>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: 14 }}>
                {grouped[floor].map(room => {
                  const st = getS(room.physicalStatus);
                  const isDirty = room.physicalStatus === 'DIRTY';
                  const isMaint = room.physicalStatus === 'MAINTENANCE';

                  return (
                    <div key={room.roomId} style={{
                      background: '#fff', borderRadius: 12, overflow: 'hidden',
                      border: `1.5px solid ${st.border}`,
                      boxShadow: '0 1px 6px rgba(70,92,71,0.07)',
                      transition: 'transform 0.14s, box-shadow 0.14s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(70,92,71,0.13)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(70,92,71,0.07)'; }}
                    >
                      <div style={{ height: 3, background: st.accent }} />
                      <div style={{ padding: '13px 15px' }}>

                        {/* Name + badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#212121' }}>{room.roomName}</span>
                            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 7 }}>{room.roomTypeName}</span>
                          </div>
                          <span style={{
                            background: st.bg, color: st.text, border: `1px solid ${st.border}`,
                            borderRadius: 20, padding: '3px 10px',
                            fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <i className={`bi ${st.icon}`} style={{ fontSize: 10 }} /> {st.label}
                          </span>
                        </div>

                        {/* Cleaning log */}
                        {room.lastCleanedAt && (
                          <div style={{
                            background: '#f7f9f7', borderRadius: 7, padding: '7px 10px',
                            marginBottom: 9, fontSize: 12, color: '#5a7a5c',
                            display: 'flex', flexDirection: 'column', gap: 3,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-clock-history" style={{ color: '#7a9e7c' }} />
                              <span>Cleaned at: <b style={{ color: P.primaryDark }}>{fmt(room.lastCleanedAt)}</b></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-person-circle" style={{ color: '#7a9e7c' }} />
                              <span>By: <b style={{ color: P.primaryDark }}>{room.lastCleanedBy || 'Unknown'}</b></span>
                            </div>
                            {room.cleaningNote && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <i className="bi bi-chat-left-text" style={{ color: '#7a9e7c', marginTop: 1 }} />
                                <span style={{ color: '#666' }}>{room.cleaningNote}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Incident badge */}
                        {room.incidentCount > 0 && (
                          canManage ? (
                            <button onClick={() => setSelectedIncidentRoom(room)} style={{
                              width: '100%', marginBottom: 8,
                              background: P.dirty.bg, border: `1px solid ${P.dirty.border}`,
                              borderRadius: 7, padding: '6px 11px',
                              color: P.dirty.text, fontSize: 12, fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                            }}
                              onMouseOver={e => e.currentTarget.style.background = '#fff0c0'}
                              onMouseOut={e => e.currentTarget.style.background = P.dirty.bg}
                            >
                              <i className="bi bi-exclamation-octagon-fill" />
                              {room.incidentCount} open incident{room.incidentCount !== 1 ? 's' : ''} — Click to review
                            </button>
                          ) : (
                            <div style={{
                              marginBottom: 8, background: P.dirty.bg, borderRadius: 7,
                              padding: '6px 11px', fontSize: 12, color: P.dirty.text, fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${P.dirty.border}`,
                            }}>
                              <i className="bi bi-exclamation-octagon-fill" />
                              {room.incidentCount} incident{room.incidentCount !== 1 ? 's' : ''} reported
                            </div>
                          )
                        )}

                        {/* Action buttons */}
                        {isMaint ? (
                          <div style={{
                            padding: '7px 11px', borderRadius: 8,
                            background: P.maint.bg, border: `1px solid ${P.maint.border}`,
                            fontSize: 12, color: P.maint.text, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <i className="bi bi-tools" /> Under maintenance
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 7 }}>
                            {canManage && !isDirty && (
                              <button onClick={() => handleRequestCleaning(room)} style={{
                                flex: 1, padding: '8px 0',
                                background: P.dirty.bg, color: P.dirty.accent,
                                border: `1px solid ${P.dirty.border}`,
                                borderRadius: 8, cursor: 'pointer',
                                fontWeight: 700, fontSize: 12,
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5,
                              }}
                                onMouseOver={e => e.currentTarget.style.background = '#fff0c0'}
                                onMouseOut={e => e.currentTarget.style.background = P.dirty.bg}
                              >
                                <i className="bi bi-droplet" /> Request Clean
                              </button>
                            )}

                            <button onClick={() => handleMarkClean(room.roomId)} style={{
                              flex: 1, padding: '8px 0',
                              background: isDirty ? P.primary : '#607d8b',
                              color: '#fff', border: 'none',
                              borderRadius: 8, cursor: 'pointer',
                              fontWeight: 700, fontSize: 12,
                              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5,
                              transition: 'opacity 0.14s',
                            }}
                              onMouseOver={e => e.currentTarget.style.opacity = '0.87'}
                              onMouseOut={e => e.currentTarget.style.opacity = '1'}
                            >
                              <i className="bi bi-check-circle-fill" />
                              {isDirty ? 'Mark Clean' : 'Log Service'}
                            </button>

                            <button onClick={() => handleReportIncident(room.roomId)} style={{
                              width: 38, padding: '8px',
                              background: '#f5f5f5',
                              border: '1px solid #ddd',
                              borderRadius: 8, cursor: 'pointer',
                              color: '#777', fontSize: 14,
                              display: 'flex', justifyContent: 'center', alignItems: 'center',
                              flexShrink: 0,
                            }}
                              title="Report an incident"
                              onMouseOver={e => { e.currentTarget.style.background = '#ffebee'; e.currentTarget.style.borderColor = P.maint.border; e.currentTarget.style.color = P.maint.accent; }}
                              onMouseOut={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#777'; }}
                            >
                              <i className="bi bi-exclamation-triangle-fill" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {canManage && selectedIncidentRoom && (
      <IncidentManagerModal
        room={selectedIncidentRoom}
        onClose={() => setSelectedIncidentRoom(null)}
        onRefresh={fetchRooms}
      />
    )}
    </>
  );
};
