import React from 'react';
import { APP_STRINGS } from '@/constants';

const Footer = ({ variant = 'default', price, onContinue }) => {
  
  // Booking variant
  if (variant === 'booking') {
    return (
      <footer className="fixed-bottom bg-white border-top p-3 shadow-lg">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted small fw-bold text-uppercase">Total Price</small>
            <h4 className="mb-0 fw-bold">{price}</h4>
          </div>
          <button onClick={onContinue} className="btn btn-gold px-4 py-2 fw-bold rounded-3">
            Continue to Payment <i className="fa-solid fa-arrow-right ms-2"></i>
          </button>
        </div>
      </footer>
    );
  }

  // Default (Dashboard) variant
  return (
    <footer className="py-3 px-4 mt-auto bg-light border-top text-center">
      <small className="text-muted">
        {APP_STRINGS.COPYRIGHT} {APP_STRINGS.FOOTER}
      </small>
    </footer>
  );
};

export default Footer;