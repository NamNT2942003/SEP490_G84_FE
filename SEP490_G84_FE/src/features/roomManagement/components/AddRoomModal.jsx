import React, { useState, useEffect } from 'react';

const BRAND = '#5C6F4E';

const AddRoomModal = ({ show, onClose, onSuccess, branches, roomTypes = [] }) => {
  const [formData, setFormData] = useState({
    roomName: '',
    roomTypeId: '',
    floor: '',
    branchId: '',
    physicalStatus: 'Available',
  });

  const [selectedBranchRoomTypes, setSelectedBranchRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [roomNameError, setRoomNameError] = useState(null);
  const [existingRooms, setExistingRooms] = useState([]);

  // Filter room types by selected branch and fetch existing rooms
  useEffect(() => {
    if (formData.branchId) {
      const filtered = roomTypes.filter(
        rt => rt.branchId == formData.branchId
      );
      setSelectedBranchRoomTypes(filtered);
      // Reset room type if not available in new branch
      if (filtered.length > 0 && !filtered.find(rt => rt.roomTypeId == formData.roomTypeId)) {
        setFormData(prev => ({ ...prev, roomTypeId: '' }));
      }

      // Fetch existing rooms for this branch to check duplicates
      fetchExistingRooms(formData.branchId);
    } else {
      setSelectedBranchRoomTypes([]);
      setExistingRooms([]);
      setFormData(prev => ({ ...prev, roomTypeId: '' }));
    }
  }, [formData.branchId, roomTypes]);

  // Fetch existing rooms from backend
  const fetchExistingRooms = async (branchId) => {
    try {
      console.log(`Fetching rooms for branchId: ${branchId}`);
      const url = `/api/rooms?branchId=${branchId}&size=1000`;
      console.log(`API URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        console.warn(`API returned status ${response.status}, using empty existing rooms list`);
        setExistingRooms([]);
        return;
      }
      
      const text = await response.text();
      console.log(`Response text length: ${text.length}`);
      
      if (!text) {
        console.warn('API returned empty response body');
        setExistingRooms([]);
        return;
      }
      
      const data = JSON.parse(text);
      console.log(`Parsed data: `, data);
      const rooms = data.rooms || [];
      console.log(`Found ${rooms.length} existing rooms`);
      setExistingRooms(rooms.map(r => r.roomName?.toLowerCase().trim()));
    } catch (err) {
      console.error('Failed to fetch existing rooms:', err.message);
      setExistingRooms([]);
    }
  };

  // Check for duplicate room name
  const checkDuplicateRoomName = (roomName) => {
    const trimmedName = roomName?.toLowerCase().trim();
    if (trimmedName && existingRooms.includes(trimmedName)) {
      setRoomNameError(`Room name "${roomName}" already exists in this branch`);
      return true;
    } else {
      setRoomNameError(null);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);

    // Check for duplicate room name in real-time
    if (name === 'roomName') {
      checkDuplicateRoomName(value);
    }
  };

  // Manage body scroll when modal opens/closes
  useEffect(() => {
    if (show) {
      // Prevent body scroll when modal is open
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0';
      return () => {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0';
      };
    } else {
      // Ensure cleanup when modal closes
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0';
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.roomName.trim()) {
      setError('Room name is required');
      return;
    }

    // Check for duplicate room name
    if (checkDuplicateRoomName(formData.roomName)) {
      setError('This room name already exists in the selected branch. Please use a different name.');
      return;
    }

    if (!formData.roomTypeId) {
      setError('Room type is required');
      return;
    }
    if (!formData.floor || formData.floor <= 0) {
      setError('Floor must be a positive number');
      return;
    }
    if (!formData.branchId) {
      setError('Branch is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: formData.roomName.trim(),
          roomTypeId: parseInt(formData.roomTypeId),
          floor: parseInt(formData.floor),
          physicalStatus: formData.physicalStatus,
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to create room`);
        } catch (parseErr) {
          throw new Error(`HTTP ${response.status}: Server error - invalid response`);
        }
      }

      const result = await response.json();
      setSuccessMessage('Room created successfully!');
      
      // Reset form
      setFormData({
        roomName: '',
        roomTypeId: '',
        floor: '',
        branchId: '',
        physicalStatus: 'Available',
      });
      setRoomNameError(null);

      // Call callback after 1 second to show success message
      setTimeout(() => {
        onSuccess && onSuccess(result.room);
        onClose();
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="modal fade show"
        style={{
          display: 'block',
          backgroundColor: 'rgba(0,0,0,0.5)',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1050,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        tabIndex="-1"
        role="dialog"
        onClick={(e) => {
          // Close modal when clicking on backdrop (outside modal dialog)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{ backgroundColor: BRAND, borderBottom: 'none' }}
            >
              <h5 className="modal-title text-white fw-bold">Add New Room</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={loading}
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4" style={{ overflowY: 'auto', maxHeight: '75vh' }}>
              {/* Success Message */}
              {successMessage && (
                <div className="alert alert-success mb-3" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Branch Selection */}
                <div className="mb-3">
                  <label className="form-label fw-500" style={{ color: BRAND }}>
                    Branch <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  >
                    <option value="">-- Select Branch --</option>
                    {branches && branches.map(branch => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Type Selection */}
                <div className="mb-3">
                  <label className="form-label fw-500" style={{ color: BRAND }}>
                    Room Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="roomTypeId"
                    value={formData.roomTypeId}
                    onChange={handleInputChange}
                    disabled={loading || !formData.branchId || selectedBranchRoomTypes.length === 0}
                    required
                  >
                    <option value="">-- Select Room Type --</option>
                    {selectedBranchRoomTypes.map(roomType => (
                      <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                        {roomType.name}
                      </option>
                    ))}
                  </select>
                  {formData.branchId && selectedBranchRoomTypes.length === 0 && (
                    <small className="text-warning d-block mt-1">
                      <i className="bi bi-info-circle me-1"></i>
                      No room types available for this branch
                    </small>
                  )}
                </div>

                {/* Room Name */}
                <div className="mb-3">
                  <label className="form-label fw-500" style={{ color: BRAND }}>
                    Room Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${roomNameError ? 'is-invalid' : ''}`}
                    name="roomName"
                    value={formData.roomName}
                    onChange={handleInputChange}
                    placeholder="e.g., B2-101, Room 101"
                    disabled={loading}
                    required
                  />
                  {roomNameError && (
                    <small className="text-danger d-block mt-1">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {roomNameError}
                    </small>
                  )}
                </div>

                {/* Floor */}
                <div className="mb-3">
                  <label className="form-label fw-500" style={{ color: BRAND }}>
                    Floor <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="1"
                    min="1"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Physical Status */}
                <div className="mb-4">
                  <label className="form-label fw-500" style={{ color: BRAND }}>
                    Initial Status
                  </label>
                  <select
                    className="form-select"
                    name="physicalStatus"
                    value={formData.physicalStatus}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Order">Out of Order</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn text-white flex-grow-1"
                    style={{ backgroundColor: BRAND }}
                    disabled={loading || !!roomNameError}
                    title={roomNameError ? 'Please fix the room name error' : ''}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Create Room
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary flex-grow-1"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddRoomModal;
