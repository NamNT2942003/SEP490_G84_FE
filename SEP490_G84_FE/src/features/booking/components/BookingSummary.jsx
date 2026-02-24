import React from 'react';

const BookingSummary = () => {
  return (
    <div className="card-custom">
      {/* Khung chứa ảnh để không bị tràn */}
      <div className="img-container mb-3">
        <img 
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800" 
          alt="Room" 
        />
      </div>

      <div className="booking-info">
        <div className="mb-3">
          <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            Resort Name
          </small>
          <p className="fw-bold text-olive mb-0">Grand Heritage Resort</p>
        </div>

        <div className="mb-3">
          <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '10px' }}>
            Room Type
          </small>
          <p className="fw-bold mb-0 text-dark">Deluxe King Room</p>
        </div>

        <div className="row">
          <div className="col-6">
            <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '10px' }}>Guests</small>
            <p className="small fw-semibold mb-0">2 Adults</p>
          </div>
          <div className="col-6 text-end">
            <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '10px' }}>Duration</small>
            <p className="small fw-semibold mb-0">3 Nights</p>
          </div>
        </div>
        
        <hr className="my-3 text-muted opacity-25" />
        
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Total</span>
          <span className="h5 mb-0 fw-bold text-dark">$250.00</span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;