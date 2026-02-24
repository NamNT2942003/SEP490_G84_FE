import React from 'react';

const BookingSummary = () => {
  return (
    <div className="bg-white rounded-3 p-3 border custom-shadow">
      <img
        alt="Resort Room"
        className="img-fluid rounded-3 mb-3"
        src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"
      />
      <div className="mb-2">
        <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Resort Name</p>
        <p className="fw-bold text-olive-dark mb-0 fs-6">Grand Heritage Resort</p>
      </div>
      <div className="mb-2">
        <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Room Type</p>
        <p className="fw-semibold text-dark mb-0">Deluxe King Room</p>
      </div>
      <div className="mb-2">
        <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Guests</p>
        <p className="fw-semibold text-dark mb-0">2 Adults</p>
      </div>
      <div>
        <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Dates</p>
        <div className="d-flex align-items-center gap-2 fw-semibold text-dark">
          <i className="fa-solid fa-calendar small"></i>
          <span>12 Oct - 15 Oct (3 Nights)</span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;