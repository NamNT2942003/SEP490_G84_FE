import React from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
      
      {/* Icon */}
      <div className="mb-4 text-brand opacity-50">
        <i className="bi bi-cone-striped" style={{ fontSize: '5rem', color: COLORS.PRIMARY }}></i>
      </div>

      {/* 404 */}
      <h1 className="display-1 fw-bold" style={{ color: COLORS.PRIMARY, letterSpacing: '5px' }}>
        404
      </h1>

      {/* Message */}
      <h2 className="fs-3 fw-bold mb-3 text-dark">Room Not Found?</h2>
      <p className="text-muted mb-5" style={{ maxWidth: '500px' }}>
        Sorry, it looks like you're trying to open a door that doesn't exist or this page is under maintenance.
        Please return to the main dashboard.
      </p>

      {/* Navigation */}
      <div className="d-flex gap-3">
        <Buttons 
          variant="outline" 
          onClick={() => navigate(-1)}
          icon={<i className="bi bi-arrow-left"></i>}
        >
          Go Back
        </Buttons>

        <Buttons 
          onClick={() => navigate('/dashboard')}
          icon={<i className="bi bi-house-door-fill"></i>}
          className="shadow-sm"
        >
          Return to Dashboard
        </Buttons>
      </div>

      {/* Footer */}
      <div className="mt-5 text-muted small fixed-bottom pb-4">
        {APP_STRINGS.APP_NAME} System
      </div>
    </div>
  );
};

export default NotFound;