import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons.jsx';
import { APP_STRINGS, COLORS } from '@/constants';
import { forgotPass } from '../api/forgotPass';
import './ForgotPassword.css'; // Import file CSS chúng ta vừa tạo

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); 

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await forgotPass.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      const msg = err.response?.data || 'An error occurred, please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-page-container">
      
      {/* CỘT TRÁI - Thông tin & Ảnh nền */}
      <div className="forgot-left-panel">
        <img src="/assets/hotel-preview.png" alt="Background" />
        <div className="forgot-left-content">
          <h2 className="forgot-left-title">{APP_STRINGS.APP_NAME}</h2>
          <p style={{ opacity: 0.8, fontSize: '1.125rem' }}>Password Recovery Service</p>
        </div>
      </div>

      {/* CỘT PHẢI - Form */}
      <div className="forgot-right-panel">
        <div className="forgot-form-wrapper">
          
          {/* Nút Back */}
          <button 
            className="btn-text-brand"
            onClick={() => navigate('/login')}
          >
            <i className="bi bi-arrow-left"></i> Back to Login
          </button>

          {!isSubmitted ? (
            <>
              {/* Tiêu đề Form */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="forgot-heading">Forgot Password?</h3>
                <p className="forgot-subtitle">Enter your email to receive reset instructions.</p>
                
                {error && (
                  <div className="forgot-error-msg" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i> {error}
                  </div>
                )}
              </div>

              {/* Form Nhập Email */}
              <form onSubmit={handleSubmit}>
                <div className="forgot-input-group">
                  <label htmlFor="resetEmail">Enter your email</label>
                  <input
                    type="email"
                    id="resetEmail"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if(error) setError(null);
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-brand"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    'SEND RESET LINK'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Màn hình Thành công */
            <div style={{ textAlign: 'center' }}>
              <div className="success-icon-container">
                <i className="bi bi-check-lg"></i>
              </div>
              <h3 className="forgot-heading">Check your inbox</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Email sent to: <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Please check your email and click on the provided link to reset your password.
              </p>
              
              <button 
                className="btn-brand" 
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          )}

          <div className="footer-text">
            {APP_STRINGS.FOOTER}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;