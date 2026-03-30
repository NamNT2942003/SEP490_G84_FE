import React, { useState } from 'react';
import { checkInApi } from '../api/checkInApi';

export default function BookingDetailModal({ show, onClose, booking, onRefresh }) {
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  if (!show || !booking) return null;

  const handleEditClick = (stay) => {
    setEditingGuestId(stay.guestId);
    setEditForm({
      guestName: stay.guestName || '',
      identityNumber: stay.identityNumber || '',
      phone: stay.phone || '',
      email: stay.email || '',
      dateOfBirth: stay.dateOfBirth || '',
      nationality: stay.nationality || '',
      gender: stay.gender || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingGuestId(null);
    setEditForm({});
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveGuest = async (guestId) => {
    if (!editForm.guestName || !editForm.identityNumber) {
      alert("Guest Name and ID/Passport cannot be empty!");
      return;
    }

    setIsSaving(true);
    try {
      // FIX TẠI ĐÂY: Loại bỏ empty string của dateOfBirth
      const payload = {
        ...editForm,
        dateOfBirth: editForm.dateOfBirth === '' ? null : editForm.dateOfBirth,
        identityNumber: editForm.identityNumber === '' ? null : editForm.identityNumber
      };

      await checkInApi.updateGuestInfo(guestId, payload);
      alert("Guest information updated successfully!");
      setEditingGuestId(null);
      if (onRefresh) onRefresh(); 
    } catch (error) {
      console.error("Update guest error:", error);
      alert(error.response?.data?.error || "Failed to update guest information!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            
            <div className="modal-header bg-dark text-white border-0">
              <div>
                <h5 className="modal-title fw-bold">Booking Details: {booking.bookingCode}</h5>
                <small className="text-secondary">Status: <span className="text-warning">{booking.status}</span></small>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>

            <div className="modal-body bg-light">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="text-secondary fw-bold mb-3 border-bottom pb-2">GENERAL INFO</h6>
                      <p className="mb-1"><strong>Booker:</strong> {booking.guestName}</p>
                      <p className="mb-1"><strong>Source:</strong> {booking.source}</p>
                      <p className="mb-1"><strong>Total Amount:</strong> {booking.totalAmount?.toLocaleString()} VND</p>
                      <p className="mb-2"><strong>Payment:</strong> 
                        <span className={`ms-2 badge ${booking.paymentStatus === 'PAID' ? 'bg-success' : 'bg-danger'}`}>
                          {booking.paymentStatus}
                        </span>
                      </p>
                      
                      {booking.status !== 'CONFIRMED' && (
                        <div className="mb-0 mt-3 p-2 bg-info bg-opacity-10 rounded border border-info-subtle">
                          <i className="bi bi-luggage text-info me-2"></i>
                          <strong className="text-dark">Luggage Note:</strong> 
                          <div className="text-secondary small mt-1">{booking.luggageNote || <span className="text-muted fst-italic">No luggage deposited.</span>}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="text-secondary fw-bold mb-3 border-bottom pb-2">STAY DATES</h6>
                      <p className="mb-1"><strong>Check-In:</strong> {booking.checkIn}</p>
                      <p className="mb-1"><strong>Check-Out:</strong> {booking.checkOut}</p>
                      <p className="mb-0"><strong>Duration:</strong> {booking.nights} nights</p>
                    </div>
                  </div>
                </div>
              </div>

              {booking.status === 'CHECKED_IN' && booking.stayDetails && booking.stayDetails.length > 0 && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <h6 className="text-secondary fw-bold m-3 border-bottom pb-2">IN-HOUSE GUEST DETAILS</h6>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small">
                          <tr>
                            <th>Room</th>
                            <th>Guest Name</th>
                            <th>Identity / Passport</th>
                            <th>System Audit</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.stayDetails.map((stay, idx) => {
                            const isEditing = editingGuestId === stay.guestId;
                            const isExpanded = expandedRow === stay.stayId;

                            return (
                              <React.Fragment key={idx}>
                                <tr>
                                  <td>
                                    <span className="badge bg-warning text-dark me-2">Room {stay.roomName}</span>
                                    <div className="small text-muted mt-1">{stay.roomTypeName}</div>
                                  </td>
                                  
                                  <td className="fw-bold text-primary">
                                    {isEditing ? (
                                      <input type="text" className="form-control form-control-sm" value={editForm.guestName} onChange={(e) => handleFormChange('guestName', e.target.value)} placeholder="Enter exact name..." />
                                    ) : (
                                      stay.guestName
                                    )}
                                  </td>

                                  <td>
                                    {isEditing ? (
                                      <input type="text" className="form-control form-control-sm bg-light" value={editForm.identityNumber} disabled title="ID/Passport is a unique identifier and cannot be edited. Use Undo Check-in if needed." />
                                    ) : (
                                      stay.identityNumber || <span className="text-muted fst-italic">N/A</span>
                                    )}
                                  </td>
                                  
                                  <td>
                                    <div className="small">
                                      <span className="text-muted">By:</span> <span className="fw-medium">{stay.checkInBy}</span>
                                    </div>
                                    <div className="small mt-1">
                                      <span className="text-muted">At:</span> {stay.actualCheckInTime}
                                    </div>
                                  </td>

                                  <td className="text-end">
                                    {isEditing ? (
                                      <>
                                        <button className="btn btn-sm btn-success me-1" onClick={() => handleSaveGuest(stay.guestId)} disabled={isSaving}>
                                          {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelEdit} disabled={isSaving}>Cancel</button>
                                      </>
                                    ) : (
                                      <>
                                        <button className="btn btn-sm btn-outline-info me-1" onClick={() => setExpandedRow(isExpanded ? null : stay.stayId)}>
                                          {isExpanded ? 'Hide' : 'More'}
                                        </button>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(stay)}>
                                          <i className="bi bi-pencil-square"></i> Edit
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>

                                {(isExpanded || isEditing) && (
                                  <tr className="bg-light">
                                    <td colSpan="5" className="p-3 border-bottom">
                                      <div className="row g-2">
                                        <div className="col-md-3">
                                          <label className="form-label small text-muted mb-1">Phone</label>
                                          {isEditing ? <input type="text" className="form-control form-control-sm" value={editForm.phone} onChange={(e) => handleFormChange('phone', e.target.value)} /> : <div className="fw-medium">{stay.phone || '-'}</div>}
                                        </div>
                                        <div className="col-md-3">
                                          <label className="form-label small text-muted mb-1">Email</label>
                                          {isEditing ? <input type="email" className="form-control form-control-sm" value={editForm.email} onChange={(e) => handleFormChange('email', e.target.value)} /> : <div className="fw-medium">{stay.email || '-'}</div>}
                                        </div>
                                        <div className="col-md-2">
                                          <label className="form-label small text-muted mb-1">DOB</label>
                                          {isEditing ? <input type="date" className="form-control form-control-sm" value={editForm.dateOfBirth} onChange={(e) => handleFormChange('dateOfBirth', e.target.value)} /> : <div className="fw-medium">{stay.dateOfBirth || '-'}</div>}
                                        </div>
                                        <div className="col-md-2">
                                          <label className="form-label small text-muted mb-1">Gender</label>
                                          {isEditing ? (
                                            <select className="form-select form-select-sm" value={editForm.gender} onChange={(e) => handleFormChange('gender', e.target.value)}>
                                              <option value="">--</option>
                                              <option value="MALE">Male</option>
                                              <option value="FEMALE">Female</option>
                                            </select>
                                          ) : <div className="fw-medium">{stay.gender || '-'}</div>}
                                        </div>
                                        <div className="col-md-2">
                                          <label className="form-label small text-muted mb-1">Nationality</label>
                                          {isEditing ? <input type="text" className="form-control form-control-sm" value={editForm.nationality} onChange={(e) => handleFormChange('nationality', e.target.value)} /> : <div className="fw-medium">{stay.nationality || '-'}</div>}
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
                </div>
              )}

            </div>

            <div className="modal-footer border-0 bg-white">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Close</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}