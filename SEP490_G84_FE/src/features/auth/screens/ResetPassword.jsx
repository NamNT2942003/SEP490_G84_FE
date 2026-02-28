import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import Buttons from '@/components/ui/Buttons.jsx'; 
import { APP_STRINGS, COLORS } from '@/constants';
import { forgotPass } from '../api/forgotPass'; 
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      await forgotPass.resetPassword(token, password);
      setSuccess(true); 
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError("The link has expired or is invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-page-wrapper">
      
      {/* CỘT TRÁI */}
      <div className="left-side">
        <div className="left-overlay" style={{ backgroundColor: COLORS.PRIMARY }}></div>
        <img src="/assets/hotel-preview.png" alt="BG" />
        <div className="left-content">
          <h2 style={{ fontWeight: 'bold' }}>{APP_STRINGS.APP_NAME}</h2>
          <p style={{ opacity: 0.8 }}>Secure Password Reset</p>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="right-side">
        <div className="form-container">
          {!success ? (
            <>
              <div style={{ marginBottom: '25px' }}>
                <Buttons 
                  variant="text" 
                  className="p-0" 
                  onClick={() => navigate('/login')}
                  icon={<i className="bi bi-arrow-left"></i>}
                >
                  Back to Login
                </Buttons>
              </div>

              <div className="mb-4">
                <h3 style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Set New Password</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Please create a strong password for your account.</p>
                {error && <div style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="custom-input-group">
                  <label>New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span 
                    style={{ position: 'absolute', right: '15px', top: '40px', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </span>
                </div>

                <div className="custom-input-group">
                  <label>Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span 
                    style={{ position: 'absolute', right: '15px', top: '40px', cursor: 'pointer' }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </span>
                </div>

                <Buttons type="submit" className="w-100 py-3" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "RESET PASSWORD"}
                </Buttons>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: COLORS.PRIMARY }}>Password Changed!</h3>
              <p>Your password has been updated successfully.</p>
              <Buttons onClick={() => navigate('/login')}>Back to Login Now</Buttons>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;