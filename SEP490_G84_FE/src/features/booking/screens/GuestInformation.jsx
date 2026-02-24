import React, { useState } from 'react';
import BookingSummary from '../components/BookingSummary';

const GuestInformation = () => {
  const [isBookingForSomeone, setIsBookingForSomeone] = useState(false);

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Header */}
      <header className="bg-olive p-3 sticky-top shadow-sm">
        <div className="container d-flex align-items-center">
          <button className="btn text-white p-0 me-3"><i className="fa-solid fa-arrow-left"></i></button>
          <h5 className="mb-0 mx-auto text-white">Guest Information</h5>
        </div>
      </header>

      <main className="container mt-4">
        <div className="row">
          {/* Cột trái: Form */}
          <div className="col-lg-8">
            
            {/* Chọn loại đặt phòng */}
            <div className="d-flex gap-3 mb-4">
              <div 
                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer ${!isBookingForSomeone ? 'border-success bg-white shadow-sm' : 'bg-white'}`}
                onClick={() => setIsBookingForSomeone(false)}
                style={{ cursor: 'pointer', border: !isBookingForSomeone ? '2px solid var(--hotel-olive) !important' : '1px solid #dee2e6' }}
              >
                <i className={`fa-solid fa-user mb-2 ${!isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                <div className={`fw-bold small ${!isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking for myself</div>
              </div>

              <div 
                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer ${isBookingForSomeone ? 'border-success bg-white shadow-sm' : 'bg-white'}`}
                onClick={() => setIsBookingForSomeone(true)}
                style={{ cursor: 'pointer', border: isBookingForSomeone ? '2px solid var(--hotel-olive) !important' : '1px solid #dee2e6' }}
              >
                <i className={`fa-solid fa-users mb-2 ${isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                <div className={`fw-bold small ${isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking for someone else</div>
              </div>
            </div>

            {/* Form chi tiết */}
            <div className="card-custom bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3">Your Contact Details</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Full Name</label>
                  <input type="text" className="form-control form-control-lg fs-6" placeholder="John Doe" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address</label>
                  <input type="email" className="form-control form-control-lg fs-6" placeholder="john@example.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number</label>
                  <input type="tel" className="form-control form-control-lg fs-6" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="card-custom bg-white p-4">
              <h5 className="fw-bold mb-3">Special Requests</h5>
              <textarea className="form-control" rows="4" placeholder="e.g. high floor, extra pillows..."></textarea>
            </div>
          </div>

          {/* Cột phải: Summary */}
          <div className="col-lg-4 mt-4 mt-lg-0">
            <div className="sticky-top" style={{ top: '90px' }}>
              <BookingSummary />
            </div>
          </div>
        </div>
      </main>

      {/* Footer thanh toán */}
      <footer className="fixed-bottom bg-white border-top p-3 shadow-lg">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small fw-bold text-uppercase">Total Price</div>
            <div className="h4 mb-0 fw-bold">$250.00</div>
          </div>
          <button className="btn btn-gold px-4 py-2 fw-bold rounded-3">
            Continue to Payment <i className="fa-solid fa-arrow-right ms-2"></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default GuestInformation;