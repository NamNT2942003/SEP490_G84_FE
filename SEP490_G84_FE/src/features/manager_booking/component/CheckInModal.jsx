import React, { useState, useEffect } from 'react';
import { checkInApi } from '../api/checkInApi';

const generateInitialAssignments = (booking) => {
  if (!booking || !booking.roomDetails) return [];
  const initial = [];
  booking.roomDetails.forEach((detail) => {
    for (let i = 0; i < detail.quantity; i++) {
      initial.push({
        id: `${detail.roomTypeName}-${i}`, 
        roomTypeName: detail.roomTypeName,
        selectedRoomId: '',
        guestName: i === 0 ? booking.guestName : '', 
        identityNumber: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        nationality: 'VN',
        gender: '',
        showExtra: false
      });
    }
  });
  return initial;
};

export default function CheckInModal({ show, onClose, booking, branchId, onSuccess }) {
  const [assignments, setAssignments] = useState(() => generateInitialAssignments(booking));
  const [availableRooms, setAvailableRooms] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [applyEarlyCheckIn, setApplyEarlyCheckIn] = useState(false);
  const [earlyCheckInFee, setEarlyCheckInFee] = useState('');
  const [earlyCheckInNote, setEarlyCheckInNote] = useState('');
  const [luggageNote, setLuggageNote] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await checkInApi.getAvailableRooms(branchId);
        setAvailableRooms(data);
      } catch (error) {
        console.error("Fetch available rooms error:", error);
        setErrorMessage("Failed to load available rooms from the server!");
      }
    };
    if (show && branchId) fetchRooms();
  }, [show, branchId]);

  // FIX TẠI ĐÂY: Tránh mutate trực tiếp object con trong mảng
  const handleChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setAssignments(newAssignments);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmitCheckIn = async () => {
    setErrorMessage('');
    const isInvalid = assignments.some(a => !a.selectedRoomId || !a.guestName || !a.identityNumber);
    if (isInvalid) {
      setErrorMessage("Please select a physical room, enter Guest Name and ID/Passport for all assignments!");
      return;
    }

    setIsSubmitting(true);
    try {
      // FIX TẠI ĐÂY: Clean data rỗng trước khi đẩy xuống Backend
      const cleanedAssignments = assignments.map(assign => ({
        ...assign,
        dateOfBirth: assign.dateOfBirth === '' ? null : assign.dateOfBirth
      }));

      const payload = {
        assignments: cleanedAssignments,
        earlyCheckInFee: applyEarlyCheckIn && earlyCheckInFee ? Number(earlyCheckInFee) : 0,
        earlyCheckInNote: applyEarlyCheckIn ? earlyCheckInNote : ''
      };

      await checkInApi.processCheckIn(booking.id, payload);
      alert("Check-in completed successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Check-in Error:", error);
      setErrorMessage(error.response?.data?.error || "A system error occurred during check-in!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkArrived = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await checkInApi.markAsArrived(booking.id, luggageNote);
      alert("Guest arrival and luggage information recorded successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Mark Arrived Error:", error);
      setErrorMessage(error.response?.data?.error || "Failed to save arrival and luggage info!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show || !booking) return null;

  const hasMissingRooms = assignments.some(assign => !availableRooms[assign.roomTypeName] || availableRooms[assign.roomTypeName].length === 0);

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            
            <div className="modal-header bg-dark text-white border-0">
              <div>
                <h5 className="modal-title fw-bold">Check-In / Arrival Process</h5>
                <small className="text-secondary">Booking: {booking.bookingCode} | Booker: {booking.guestName}</small>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
            </div>

            <div className="modal-body bg-light">
              
              {errorMessage && (
                <div className="alert alert-danger d-flex align-items-center shadow-sm border-danger border-start border-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-danger"></i>
                  <div>
                    <h6 className="alert-heading fw-bold mb-1">System Warning!</h6>
                    <div className="mb-0">{errorMessage}</div>
                  </div>
                  <button type="button" className="btn-close ms-auto" onClick={() => setErrorMessage('')}></button>
                </div>
              )}

              <div className="card border-warning shadow-sm mb-4">
                <div className="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center py-2">
                  <span><i className="bi bi-clock-history me-2"></i>Early Check-in Surcharge</span>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchEarly" checked={applyEarlyCheckIn} onChange={(e) => setApplyEarlyCheckIn(e.target.checked)} disabled={isSubmitting} />
                    <label className="form-check-label small" htmlFor="flexSwitchEarly">Apply Surcharge</label>
                  </div>
                </div>
                
                {applyEarlyCheckIn && (
                  <div className="card-body bg-warning bg-opacity-10 py-3">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small mb-1 fw-bold text-dark">Amount (VND)</label>
                        <input type="number" className="form-control border-warning" value={earlyCheckInFee} onChange={(e) => setEarlyCheckInFee(e.target.value)} placeholder="E.g., 500000" disabled={isSubmitting} />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label small mb-1 fw-bold text-dark">Reason / Invoice Note</label>
                        <input type="text" className="form-control border-warning" value={earlyCheckInNote} onChange={(e) => setEarlyCheckInNote(e.target.value)} placeholder="E.g., Early check-in at 08:00 AM" disabled={isSubmitting} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <h6 className="fw-bold mb-3 text-secondary">ROOM ASSIGNMENT & GUEST REGISTRATION</h6>
              
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-0">
                  <table className="table mb-0 align-middle">
                    <thead className="table-light text-muted small">
                      <tr>
                        <th style={{ width: '20%' }}>ROOM TYPE</th>
                        <th style={{ width: '25%' }}>ASSIGN ROOM</th>
                        <th style={{ width: '30%' }}>PRIMARY GUEST NAME</th>
                        <th style={{ width: '25%' }}>ID / PASSPORT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assign, index) => {
                        const roomsForType = availableRooms[assign.roomTypeName];
                        const isOutOfRooms = !roomsForType || roomsForType.length === 0;

                        return (
                          <React.Fragment key={assign.id}>
                            <tr>
                              <td className="fw-medium text-dark">
                                {assign.roomTypeName}
                                <div className="small text-muted">Room #{index + 1}</div>
                                <button type="button" className="btn btn-sm btn-link text-decoration-none p-0 mt-1" onClick={() => handleChange(index, 'showExtra', !assign.showExtra)}>
                                  {assign.showExtra ? 'Hide Details ▲' : 'More Details ▼'}
                                </button>
                              </td>
                              <td>
                                {isOutOfRooms ? (
                                  <div className="text-danger small fw-bold mt-1">
                                    <i className="bi bi-x-circle me-1"></i> Occupied / Dirty
                                  </div>
                                ) : (
                                  <select className={`form-select ${errorMessage && !assign.selectedRoomId ? 'border-danger' : 'border-secondary-subtle'}`} value={assign.selectedRoomId} onChange={(e) => handleChange(index, 'selectedRoomId', Number(e.target.value))} disabled={isSubmitting}>
                                    <option value="">-- Select Room --</option>
                                    {roomsForType.map(room => (
                                      <option key={room.id} value={room.id}>Room {room.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td>
                                <input type="text" className={`form-control ${errorMessage && !assign.guestName ? 'border-danger' : 'border-secondary-subtle'}`} placeholder="Enter full name..." value={assign.guestName} onChange={(e) => handleChange(index, 'guestName', e.target.value)} disabled={isSubmitting} />
                              </td>
                              <td>
                                <input type="text" className={`form-control ${errorMessage && !assign.identityNumber ? 'border-danger' : 'border-secondary-subtle'}`} placeholder="Passport/ID Number..." value={assign.identityNumber} onChange={(e) => handleChange(index, 'identityNumber', e.target.value)} disabled={isSubmitting} />
                              </td>
                            </tr>

                            {assign.showExtra && (
                              <tr className="bg-light">
                                <td colSpan="4" className="p-3 border-bottom">
                                  <div className="row g-2">
                                    <div className="col-md-3">
                                      <label className="form-label small text-muted mb-1">Phone</label>
                                      <input type="text" className="form-control form-control-sm" value={assign.phone} onChange={(e) => handleChange(index, 'phone', e.target.value)} disabled={isSubmitting}/>
                                    </div>
                                    <div className="col-md-3">
                                      <label className="form-label small text-muted mb-1">Email</label>
                                      <input type="email" className="form-control form-control-sm" value={assign.email} onChange={(e) => handleChange(index, 'email', e.target.value)} disabled={isSubmitting}/>
                                    </div>
                                    <div className="col-md-2">
                                      <label className="form-label small text-muted mb-1">DOB</label>
                                      <input type="date" className="form-control form-control-sm" value={assign.dateOfBirth} onChange={(e) => handleChange(index, 'dateOfBirth', e.target.value)} disabled={isSubmitting}/>
                                    </div>
                                    <div className="col-md-2">
                                      <label className="form-label small text-muted mb-1">Gender</label>
                                      <select className="form-select form-select-sm" value={assign.gender} onChange={(e) => handleChange(index, 'gender', e.target.value)} disabled={isSubmitting}>
                                        <option value="">--</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                      </select>
                                    </div>
                                    <div className="col-md-2">
                                      <label className="form-label small text-muted mb-1">Nationality</label>
                                      <input type="text" className="form-control form-control-sm" value={assign.nationality} onChange={(e) => handleChange(index, 'nationality', e.target.value)} disabled={isSubmitting}/>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-secondary bg-opacity-10 border border-secondary-subtle rounded">
                <label className="form-label fw-bold text-dark mb-1">
                  <i className="bi bi-briefcase-fill me-2"></i>Pre-arrival Luggage Storage
                </label>
                <input type="text" className="form-control" placeholder="E.g., 2 large red suitcases, Tag #45" value={luggageNote} onChange={(e) => setLuggageNote(e.target.value)} disabled={isSubmitting} />
                <div className="small text-muted mt-1">
                  *If rooms are not ready, enter luggage details and click <strong className="text-info-emphasis">"Mark Arrived & Store Luggage"</strong> below.
                </div>
              </div>

            </div>

            <div className="modal-footer border-0 bg-white d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-info px-4 fw-bold text-white shadow-sm" onClick={handleMarkArrived} disabled={isSubmitting}>
                  <i className="bi bi-person-check-fill me-2"></i>Mark Arrived & Store Luggage
                </button>
                <button type="button" className="btn btn-success px-4 fw-bold shadow-sm" onClick={handleSubmitCheckIn} disabled={isSubmitting || hasMissingRooms} title={hasMissingRooms ? "Cannot check-in due to missing clean rooms!" : ""}>
                  <i className="bi bi-key-fill me-2"></i>Confirm Check-In
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}