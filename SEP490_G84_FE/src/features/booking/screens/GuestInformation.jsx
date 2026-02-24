import React, { useState } from 'react';
import BookingSummary from '../components/BookingSummary';
import Input from '../../../components/ui/Input';

const GuestInformation = () => {
  const [isBookingForSomeone, setIsBookingForSomeone] = useState(false);

  return (
    <div className="bg-light" style={{ paddingBottom: '150px' }}>
      {/* Header */}
      <header className="bg-olive p-3 sticky-top shadow-sm">
        <div className="container d-flex align-items-center">
          <button className="btn text-white p-0 me-3 fs-5">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h5 className="mb-0 mx-auto text-white fw-semibold">Guest Information</h5>
        </div>
      </header>

      <main className="container mt-4">
        <div className="row g-4">
          {/* Left Column: Forms */}
          <div className="col-lg-8">
            {/* Booking Type Selection */}
            <div className="d-flex gap-3 mb-4">
              <div
                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer bg-white ${!isBookingForSomeone ? 'border-2 border-olive shadow-sm' : 'border-1'}`}
                onClick={() => setIsBookingForSomeone(false)}
              >
                <i className={`fa-solid fa-user mb-1 ${!isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                <div className={`fw-semibold small ${!isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking for myself</div>
              </div>
              <div
                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer bg-white ${isBookingForSomeone ? 'border-2 border-olive shadow-sm' : 'border-1'}`}
                onClick={() => setIsBookingForSomeone(true)}
              >
                <i className={`fa-solid fa-users mb-1 ${isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                <div className={`fw-semibold small ${isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking for someone else</div>
              </div>
            </div>

            {/* Guest Details Form */}
            <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
              <h5 className="fw-bold mb-3">Guest Details</h5>
              <div className="row">
                <div className="col-12">
                  <Input id="fullName" label="Full Name" icon="fa-user" placeholder="John Doe" type="text" />
                </div>
                <div className="col-md-6">
                  <Input id="email" label="Email Address" icon="fa-envelope" placeholder="john.doe@example.com" type="email" />
                </div>
                <div className="col-md-6">
                  <Input id="phone" label="Phone Number" icon="fa-phone" placeholder="+1 (555) 000-0000" type="tel" />
                </div>
              </div>
            </div>

            {/* Someone Else Details (Conditional) */}
            {isBookingForSomeone && (
              <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fa-solid fa-users text-olive"></i>
                    <h5 className="fw-bold mb-0">Guest Information</h5>
                </div>
                <div className="row">
                  <div className="col-12">
                    <Input id="guestFullName" label="Guest Full Name" icon="fa-user" placeholder="Enter guest's full name" type="text" />
                  </div>
                  <div className="col-md-6">
                    <Input id="guestEmail" label="Guest Email Address" icon="fa-envelope" placeholder="guest@example.com" type="email" />
                  </div>
                  <div className="col-md-6">
                    <Input id="guestPhone" label="Guest Phone Number" icon="fa-phone" placeholder="+1 (555) 000-0000" type="tel" />
                  </div>
                </div>
              </div>
            )}

            {/* Add-ons Section */}
            <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
                <h5 className="fw-bold mb-3">Add-ons</h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center p-3 border rounded-3 h-100">
                            <div className="d-flex align-items-center">
                                <div className="bg-light rounded-2 d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                    <i className="fa-solid fa-utensils text-olive"></i>
                                </div>
                                <div>
                                    <p className="fw-bold mb-0">Daily Breakfast</p>
                                    <small className="text-muted">+$25.00 / day</small>
                                </div>
                            </div>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" role="switch" id="breakfastSwitch" />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                         <div className="d-flex justify-content-between align-items-center p-3 border rounded-3 h-100">
                            <div className="d-flex align-items-center">
                                <div className="bg-light rounded-2 d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                    <i className="fa-solid fa-clock text-olive"></i>
                                </div>
                                <div>
                                    <p className="fw-bold mb-0">Early Check-in</p>
                                    <small className="text-muted">Access room at 10 AM</small>
                                </div>
                            </div>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" role="switch" id="checkinSwitch" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white p-4 rounded-3 custom-shadow">
              <h5 className="fw-bold mb-3">Special Requests</h5>
              <textarea className="form-control" rows="4" placeholder="e.g. high floor, extra pillows, allergic to certain fabrics..."></textarea>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '80px' }}>
              <h5 className="fw-bold mb-3">Your Booking</h5>
              <BookingSummary />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed-bottom bg-white border-top p-3 shadow-lg">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted small fw-bold text-uppercase">Total Price</small>
            <h4 className="mb-0 fw-bold">$250.00</h4>
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
