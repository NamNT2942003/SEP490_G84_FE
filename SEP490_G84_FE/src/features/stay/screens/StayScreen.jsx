import React, { useState, useEffect } from 'react';
import StayDetail from '../component/StayDetail';
import { stayApi } from '../api/stayApi'; 
import { useCurrentUser } from '@/hooks/useCurrentUser';

const StayScreen = () => {
  const currentUser = useCurrentUser();
  const isAdminOrManager = currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager;

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(currentUser?.branchId || '');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (!selectedBranchId && currentUser.branchId) {
         setSelectedBranchId(currentUser.branchId);
      } else {
         fetchActiveBookings();
      }
    }
  }, [selectedBranchId, currentUser]);

  const fetchActiveBookings = async () => {
    setIsLoading(true);
    try {
      const data = await stayApi.getActiveBookings(selectedBranchId);
      setBookings(data);
    } catch (error) {
      alert('Failed to load bookings. Please try again later!');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentBooking = async () => {
    try {
      const freshData = await stayApi.getActiveBookings(selectedBranchId);
      setBookings(freshData); 
      if (selectedBooking) {
        const updatedBooking = freshData.find(b => b.bookingId === selectedBooking.bookingId);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        }
      }
    } catch (error) {
      console.error("Error refreshing data", error);
    }
  };

  if (selectedBooking) {
    return (
      <div className="container-fluid p-4">
        <StayDetail 
          booking={selectedBooking} 
          onBack={() => setSelectedBooking(null)} 
          onRefresh={refreshCurrentBooking} 
        />
      </div>
    );
  }

  const filteredBookings = bookings.filter((booking) => {
    if (!searchTerm) return true;
    return booking.stays?.some((stay) => 
      stay.roomName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">In-house Bookings</h2>
        
        <div className="d-flex gap-3 w-50 justify-content-end">
          {isAdminOrManager && (
            <select 
              className="form-select w-50 shadow-sm"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">-- All Branches --</option>
              <option value="1">Branch 1 (Hanoi)</option>
              <option value="2">Branch 2 (Da Nang)</option>
            </select>
          )}

          <input 
            type="text" 
            className="form-control w-50 shadow-sm" 
            placeholder="🔍 Search room (e.g. 101)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-3">Booking Code</th>
                <th className="py-3">Booker</th>
                <th className="py-3">Stay Time</th> 
                <th className="py-3">Rooms</th>
                <th className="py-3">Service Total (VND)</th>
                <th className="py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td className="px-3"><strong>{booking.bookingCode}</strong></td>
                    <td>{booking.bookerName}</td>
                    <td>{booking.stayTime}</td>
                    <td>
                      {booking.stays?.map(stay => (
                        <span key={stay.stayId} className="badge bg-info text-dark me-1">
                          {stay.roomName}
                        </span>
                      ))}
                    </td>
                    <td className="text-danger fw-bold">
                      {(booking.serviceTotal || 0) > 0 ? booking.serviceTotal.toLocaleString('en-US') : '0'}
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-primary shadow-sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {isLoading ? "Loading data..." : `No bookings found matching "${searchTerm}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StayScreen;