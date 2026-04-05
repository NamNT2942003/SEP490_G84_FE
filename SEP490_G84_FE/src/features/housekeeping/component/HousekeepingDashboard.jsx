import React, { useState, useEffect } from 'react';
import { housekeepingApi } from '../api/housekeepingApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { COLORS } from '@/constants';
import Swal from 'sweetalert2';

const SUCCESS_COLOR = '#198754';

export const HousekeepingDashboard = () => {
  const currentUser = useCurrentUser();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('DIRTY'); // 'ALL' or 'DIRTY'

  // Branch selector state (for Admin/Manager)
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const isAdmin = currentUser?.permissions?.isAdmin;
  const isManager = currentUser?.permissions?.isManager;
  const canSelectBranch = isAdmin || isManager;

  // Load branch list for Admin/Manager
  useEffect(() => {
    if (!currentUser) return;

    if (canSelectBranch) {
      housekeepingApi.getMyBranches()
        .then(res => {
          const data = res.data || [];
          setBranches(data);
          // Default: select current user's branch, or the first available branch
          const defaultBranch = data.find(b => b.branchId === currentUser.branchId) || data[0];
          setSelectedBranch(defaultBranch ? defaultBranch.branchId : currentUser.branchId);
        })
        .catch(() => {
          setSelectedBranch(currentUser.branchId);
        });
    } else {
      // Staff/Housekeeper: use fixed branch from token
      setSelectedBranch(currentUser.branchId);
    }
  }, [currentUser]);

  // Fetch rooms when the selected branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchRooms();
    }
  }, [selectedBranch]);

  const fetchRooms = async () => {
    if (!selectedBranch) return;
    try {
      setLoading(true);
      const res = await housekeepingApi.getRooms(selectedBranch);
      setRooms(res.data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load rooms. Please try again.', confirmButtonColor: COLORS.PRIMARY });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClean = async (roomId) => {
    try {
      await housekeepingApi.updateRoomStatusToClean(roomId);
      Swal.fire({ icon: 'success', title: 'Done!', text: 'Room has been marked as Clean (AVAILABLE).', timer: 2000, showConfirmButton: false });
      fetchRooms(); // Refresh the list
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update room status. Please try again.', confirmButtonColor: COLORS.PRIMARY });
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (filter === 'DIRTY') return r.physicalStatus === 'DIRTY';
    return true;
  });

  // Group rooms by floor
  const groupedByFloor = {};
  filteredRooms.forEach(room => {
    const floor = room.floor ?? 0;
    if (!groupedByFloor[floor]) groupedByFloor[floor] = [];
    groupedByFloor[floor].push(room);
  });
  const sortedFloors = Object.keys(groupedByFloor).sort((a, b) => Number(a) - Number(b));

  const statusColor = (status) => {
    switch (status) {
      case 'DIRTY': return COLORS.ERROR;
      case 'OCCUPIED': return '#0d6efd';
      case 'MAINTENANCE': return '#fd7e14';
      default: return SUCCESS_COLOR;
    }
  };

  const statusBg = (status) => {
    switch (status) {
      case 'DIRTY': return '#ffebee';
      case 'OCCUPIED': return '#e7f1ff';
      case 'MAINTENANCE': return '#fff3e0';
      default: return '#e8f5e9';
    }
  };

  // Name of the currently selected branch
  const selectedBranchName = branches.find(b => b.branchId === selectedBranch)?.branchName || '';

  return (
    <div style={{ padding: '24px 28px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: COLORS.PRIMARY, margin: 0, fontWeight: 800, letterSpacing: '-0.3px' }}>
            <i className="bi bi-stars" style={{ marginRight: 8 }} />Housekeeping Board
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
            {filter === 'DIRTY' ? 'Showing rooms that need cleaning' : 'Showing all rooms'}
            {' · '}{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
            {selectedBranchName && ` · ${selectedBranchName}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Branch selector — only visible for Admin/Manager */}
          {canSelectBranch && branches.length > 0 && (
            <select
              id="select-housekeeping-branch"
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(Number(e.target.value))}
              style={{
                padding: '7px 12px', borderRadius: 6, border: '1px solid #ddd',
                fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer',
                minWidth: 160,
              }}
            >
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
              ))}
            </select>
          )}

          <button onClick={fetchRooms} style={{ padding: '7px 14px', borderRadius: 6, background: '#fff', border: '1px solid #ddd', cursor: 'pointer', fontSize: 13 }}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #ddd' }}>
            <button 
              onClick={() => setFilter('DIRTY')}
              style={{ 
                background: filter === 'DIRTY' ? COLORS.PRIMARY : '#fff', 
                color: filter === 'DIRTY' ? '#fff' : '#555',
                border: 'none', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600
              }}
            >
              🧹 Dirty
            </button>
            <button 
              onClick={() => setFilter('ALL')}
              style={{ 
                background: filter === 'ALL' ? COLORS.PRIMARY : '#fff', 
                color: filter === 'ALL' ? '#fff' : '#555',
                border: 'none', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderLeft: '1px solid #ddd'
              }}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner-border" role="status" style={{ color: COLORS.PRIMARY }} />
          <p style={{ marginTop: 12, color: '#888' }}>Loading rooms...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ background: '#fff', padding: 40, textAlign: 'center', borderRadius: 12, border: '1px dashed #ccc' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <h4 style={{ color: SUCCESS_COLOR, margin: 0 }}>All rooms are clean!</h4>
          <p style={{ color: '#888', margin: '8px 0 0', fontSize: 14 }}>No rooms need attention right now.</p>
        </div>
      ) : (
        sortedFloors.map(floor => (
          <div key={floor} style={{ marginBottom: 24 }}>
            <h5 style={{ 
              color: COLORS.PRIMARY, fontWeight: 700, fontSize: 14, 
              textTransform: 'uppercase', letterSpacing: '0.5px', 
              marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid #eee'
            }}>
              <i className="bi bi-layers" style={{ marginRight: 6 }} />
              Floor {floor}
              <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                ({groupedByFloor[floor].length} room{groupedByFloor[floor].length !== 1 ? 's' : ''})
              </span>
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {groupedByFloor[floor].map(room => (
                <div key={room.roomId} style={{ 
                  background: '#fff', borderRadius: 10, padding: '14px 16px', 
                  borderLeft: `4px solid ${statusColor(room.physicalStatus)}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>{room.roomName}</span>
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{room.roomTypeName}</span>
                    </div>
                    <span style={{ 
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      background: statusBg(room.physicalStatus),
                      color: statusColor(room.physicalStatus),
                      textTransform: 'uppercase', letterSpacing: '0.3px'
                    }}>
                      {room.physicalStatus}
                    </span>
                  </div>

                  {room.physicalStatus === 'DIRTY' && (
                    <button 
                      onClick={() => handleMarkClean(room.roomId)}
                      style={{ 
                        marginTop: 12, width: '100%', padding: '9px', 
                        background: SUCCESS_COLOR, color: '#fff', border: 'none', 
                        borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="bi bi-check-circle-fill" /> Mark as Clean
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
