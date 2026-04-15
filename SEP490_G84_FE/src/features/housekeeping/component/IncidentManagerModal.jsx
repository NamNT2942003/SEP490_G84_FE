import React, { useState, useEffect } from 'react';
import { housekeepingApi } from '../api/housekeepingApi';
import { COLORS } from '@/constants';
import Swal from 'sweetalert2';

const MAINT_COLOR = '#fd7e14';
const SUCCESS_COLOR = '#198754';
const DANGER_COLOR = '#dc3545';

export const IncidentManagerModal = ({ room, onClose, onRefresh }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [settingMaint, setSettingMaint] = useState(false);

  useEffect(() => {
    if (room?.roomId) fetchIncidents();
  }, [room]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await housekeepingApi.getRoomIncidents(room.roomId);
      const data = res.data?.content ?? res.data ?? [];
      setIncidents(Array.isArray(data) ? data : []);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseIncident = async (incident) => {
    const result = await Swal.fire({
      title: 'Mark this incident as resolved?',
      html: `<b style="color:#333">${incident.description}</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mark Resolved',
      cancelButtonText: 'Cancel',
      confirmButtonColor: SUCCESS_COLOR,
    });

    if (!result.isConfirmed) return;

    try {
      setClosingId(incident.incidentId);
      await housekeepingApi.closeIncident(room.roomId, incident.incidentId, '');
      Swal.fire({ icon: 'success', title: 'Incident resolved!', timer: 1500, showConfirmButton: false });
      await fetchIncidents();
      onRefresh?.();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'Failed to close incident.' });
    } finally {
      setClosingId(null);
    }
  };

  const handleSetMaintenance = async () => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Set room to Maintenance?',
      text: 'The room will be locked from bookings. Enter a reason (optional):',
      input: 'text',
      inputPlaceholder: 'e.g. AC broken, waiting for repair...',
      showCancelButton: true,
      confirmButtonText: 'Confirm Maintenance',
      cancelButtonText: 'Cancel',
      confirmButtonColor: MAINT_COLOR,
      icon: 'warning',
    });

    if (!isConfirmed) return;

    try {
      setSettingMaint(true);
      await housekeepingApi.setRoomMaintenance(room.roomId, reason || '');
      Swal.fire({ icon: 'success', title: `Room ${room.roomName} set to Maintenance.`, timer: 2000, showConfirmButton: false });
      onRefresh?.();
      onClose();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'Failed to set maintenance.' });
    } finally {
      setSettingMaint(false);
    }
  };

  const openIncidents = incidents.filter(i => i.status === 'OPEN');
  const closedIncidents = incidents.filter(i => i.status !== 'OPEN');

  const formatDate = (s) => {
    if (!s) return '';
    return new Date(s).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 17, color: '#222' }}>
              <i className="bi bi-tools" style={{ marginRight: 8, color: MAINT_COLOR }} />
              Incidents — Room {room?.roomName}
            </h4>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
              {room?.roomTypeName} · {openIncidents.length} open incident{openIncidents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 22px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner-border spinner-border-sm" style={{ color: COLORS.PRIMARY }} />
              <p style={{ color: '#888', marginTop: 8 }}>Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>
              <div style={{ fontSize: 36 }}>✅</div>
              <p>No incidents on record.</p>
            </div>
          ) : (
            <>
              {openIncidents.length > 0 && (
                <>
                  <h6 style={{ color: DANGER_COLOR, fontWeight: 700, marginBottom: 10 }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ marginRight: 5 }} />
                    Open ({openIncidents.length})
                  </h6>
                  {openIncidents.map(inc => (
                    <div key={inc.incidentId} style={{
                      border: `1px solid #ffcdd2`, borderRadius: 8, padding: '12px 14px',
                      marginBottom: 10, background: '#fff8f8',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 14 }}>{inc.description}</p>
                          <p style={{ margin: '5px 0 0', fontSize: 11, color: '#999' }}>
                            <i className="bi bi-clock" style={{ marginRight: 4 }} />
                            Reported: {formatDate(inc.createdAt)}
                          </p>
                        </div>
                        <button
                          disabled={closingId === inc.incidentId}
                          onClick={() => handleCloseIncident(inc)}
                          style={{
                            padding: '6px 12px', background: SUCCESS_COLOR, color: '#fff',
                            border: 'none', borderRadius: 6, cursor: 'pointer',
                            fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
                            opacity: closingId === inc.incidentId ? 0.6 : 1,
                          }}
                        >
                          <i className="bi bi-check2-circle" style={{ marginRight: 4 }} />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {closedIncidents.length > 0 && (
                <>
                  <h6 style={{ color: '#666', fontWeight: 700, margin: '16px 0 10px' }}>
                    <i className="bi bi-check-circle-fill" style={{ marginRight: 5, color: SUCCESS_COLOR }} />
                    Resolved ({closedIncidents.length})
                  </h6>
                  {closedIncidents.map(inc => (
                    <div key={inc.incidentId} style={{
                      border: '1px solid #e8f5e9', borderRadius: 8, padding: '10px 14px',
                      marginBottom: 8, background: '#f8fff8', opacity: 0.85,
                    }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#555', textDecoration: 'line-through' }}>{inc.description}</p>
                      {inc.resolution && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: SUCCESS_COLOR }}>
                          <i className="bi bi-chat-right-text" style={{ marginRight: 4 }} />
                          Resolution: {inc.resolution}
                        </p>
                      )}
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#aaa' }}>
                        Closed: {formatDate(inc.resolvedAt)}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          {room?.physicalStatus !== 'MAINTENANCE' && (
            <button
              disabled={settingMaint}
              onClick={handleSetMaintenance}
              style={{
                padding: '8px 18px', background: MAINT_COLOR, color: '#fff',
                border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                opacity: settingMaint ? 0.6 : 1,
              }}
            >
              <i className="bi bi-tools" style={{ marginRight: 6 }} />
              Set Maintenance
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', background: '#f5f5f5', color: '#555',
              border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
