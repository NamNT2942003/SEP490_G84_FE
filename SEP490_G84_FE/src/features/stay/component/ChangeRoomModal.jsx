import React, { useState, useEffect } from 'react';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const ChangeRoomModal = ({ show, onClose, stayInfo, onSuccess }) => {
  const currentUser = useCurrentUser();
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reason, setReason] = useState('Guest requested upgrade');
  const [note, setNote] = useState('');
  const [surcharge, setSurcharge] = useState(0); 
  const [isFree, setIsFree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      fetchAvailableRooms();
      setSelectedRoomType('');
      setSelectedRoomId('');
      setReason('Guest requested upgrade');
      setNote('');
      setSurcharge(0);
      setIsFree(false);
    }
  }, [show]);

  const fetchAvailableRooms = async () => {
    try {
      // Đã truyền thêm stayInfo.stayId như API mới
      const data = await stayApi.getAvailableRooms(currentUser?.branchId, stayInfo?.stayId);
      setAvailableRooms(data);

      const types = [];
      const typeMap = new Map();
      data.forEach(room => {
        if (!typeMap.has(room.roomTypeId)) {
          typeMap.set(room.roomTypeId, true);
          types.push({ id: room.roomTypeId, name: room.roomTypeName });
        }
      });
      setRoomTypes(types);
    } catch (error) {
      console.error("Failed to fetch available rooms", error);
    }
  };

  if (!show || !stayInfo) return null;

  const filteredRooms = availableRooms.filter(
    room => room.roomTypeId === parseInt(selectedRoomType)
  );

  const handleRoomChange = (e) => {
    setSelectedRoomId(e.target.value);
    if (!isFree) {
      setSurcharge(0);
    }
  };

  const handleFreeCheckbox = (e) => {
    const checked = e.target.checked;
    setIsFree(checked);
    if (checked) setSurcharge(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      oldStayId: stayInfo.stayId,
      newRoomId: parseInt(selectedRoomId),
      surcharge: surcharge,
      reason: `${reason} - ${note}`
    };
    
    try {
      await stayApi.changeRoom(payload);
      const newRoomName = availableRooms.find(r => r.roomId === parseInt(selectedRoomId))?.roomName;
      alert(`Successfully changed room from ${stayInfo.roomName} to room ${newRoomName}!`);
      
      if (onSuccess) onSuccess(); 
      onClose(); 
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error changing room! Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow border-0">
          <div className="modal-header text-white py-3" style={{ backgroundColor: COLORS.PRIMARY }}>
            <h5 className="modal-title fw-bold">
              <i className="bi bi-arrow-left-right me-2"></i> 
              Change Room - Current: {stayInfo.roomName}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
          </div>
          
          <div className="modal-body p-4">
            <div className="alert alert-info py-2 mb-4">
              <strong>Primary Guest:</strong> {stayInfo.primaryGuestName}
            </div>
            
            <form onSubmit={handleSubmit}>
              <h6 className="fw-bold border-bottom pb-2 mb-3" style={{ color: COLORS.PRIMARY }}>
                1. Select New Room
              </h6>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Room Type</label>
                  <select 
                    className="form-select" 
                    value={selectedRoomType} 
                    onChange={(e) => {
                      setSelectedRoomType(e.target.value);
                      setSelectedRoomId(''); 
                      if(!isFree) setSurcharge(0);
                    }}
                    required
                  >
                    <option value="">-- Select Room Type --</option>
                    {roomTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Available Room</label>
                  <select 
                    className="form-select" 
                    value={selectedRoomId} 
                    onChange={handleRoomChange}
                    disabled={!selectedRoomType || filteredRooms.length === 0}
                    required
                  >
                    <option value="">-- Select Room --</option>
                    {filteredRooms.map(room => (
                      <option key={room.roomId} value={room.roomId}>
                        Room {room.roomName}
                      </option>
                    ))}
                  </select>

                  {/* THÊM LOGIC CẢNH BÁO CHO STAFF Ở ĐÂY */}
                  {selectedRoomType && filteredRooms.length === 0 ? (
                    <div className="text-danger small mt-2 fw-medium p-2 bg-danger bg-opacity-10 border border-danger-subtle rounded">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      No rooms available! Some rooms might be physically empty today but are already reserved for other guests during this stay period.
                    </div>
                  ) : (
                    <div className="text-muted small mt-1 fst-italic">
                      <i className="bi bi-info-circle me-1"></i>
                      Only rooms available for the entire stay duration are shown.
                    </div>
                  )}

                </div>
              </div>

              <h6 className="fw-bold border-bottom pb-2 mb-3" style={{ color: COLORS.PRIMARY }}>
                2. Surcharge & Reason
              </h6>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Reason for change</label>
                  <select 
                    className="form-select mb-3" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Guest requested upgrade">Guest requested upgrade</option>
                    <option value="Guest requested downgrade">Guest requested downgrade</option>
                    <option value="Facility issue (AC, Plumbing, etc.)">Facility issue (AC, Plumbing, etc.)</option>
                    <option value="Noisy environment">Noisy environment</option>
                    <option value="Other">Other...</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold d-flex justify-content-between">
                    <span>Surcharge Amount (VND)</span>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="freeCheckbox"
                        checked={isFree}
                        onChange={handleFreeCheckbox}
                      />
                      <label className="form-check-label text-success fw-bold" htmlFor="freeCheckbox">
                        Free of charge
                      </label>
                    </div>
                  </label>
                  <input 
                    type="number" 
                    className={`form-control fw-bold ${isFree ? 'text-muted bg-light' : 'text-danger'}`}
                    min="0"
                    value={surcharge}
                    onChange={(e) => setSurcharge(parseInt(e.target.value) || 0)}
                    disabled={isFree}
                  />
                  <small className="text-muted">Manually input the negotiated price difference.</small>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Detailed Note <span className="text-danger">*</span></label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g., Air conditioner in current room is leaking, moved guest to a new room..."
                  required
                ></textarea>
              </div>

              <div className="modal-footer px-0 pb-0 border-0 mt-4">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4 fw-bold" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn px-4 fw-bold shadow-sm text-white" 
                  style={{ backgroundColor: (!selectedRoomId || !note || isSubmitting) ? '#6c757d' : COLORS.PRIMARY }}
                  disabled={!selectedRoomId || !note || isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Change Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoomModal;