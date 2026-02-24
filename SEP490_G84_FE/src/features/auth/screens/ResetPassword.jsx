import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons.jsx';
import { APP_STRINGS, COLORS } from '@/constants';
import { forgotPass } from '../api/forgotPass'; // Hoặc authApi tuỳ bạn đặt tên

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
    setError(null);

    if (!token) {
      setError("Invalid link!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPass.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      const msg = err.response?.data || "The link has expired or is invalid.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden">
      <div className="row g-0 h-100">

        {/* CỘT TRÁI (Giữ nguyên) */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center position-relative text-white">
          <div className="position-absolute w-100 h-100" style={{ backgroundColor: COLORS.PRIMARY, zIndex: 1 }}></div>
          <img src="/assets/hotel-preview.png" alt="Background" className="position-absolute w-100 h-100" style={{ objectFit: 'cover', opacity: 0.2, zIndex: 0 }} />
          <div className="position-relative text-center p-5" style={{ zIndex: 2 }}>
            <h2 className="fw-bold text-uppercase mb-2">{APP_STRINGS.APP_NAME}</h2>
            <p className="lead opacity-75">Secure Password Reset</p>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '500px' }}>

            {!success ? (
              <>
                {/* --- [MỚI] THÊM NÚT BACK Ở ĐÂY --- */}
                <div className="mb-4 text-start">
                  <Buttons
                    variant="text"
                    className="p-0"
                    onClick={() => navigate('/login')}
                    icon={<i className="bi bi-arrow-left"></i>}
                  >
                    Back to Login
                  </Buttons>
                </div>
                {/* ---------------------------------- */}

                <div className="mb-4">
                  <h3 className="fw-bold text-dark">Set New Password</h3>
                  <p className="text-muted">Please create a strong password for your account.</p>

                  {error && (
                    <div className="alert alert-danger p-2 small text-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit}>
                  {/* ... (Phần Form Input giữ nguyên như code bạn gửi) ... */}
                  <div className="form-floating mb-3 position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="newPass"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <label htmlFor="newPass">New Password</label>
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-3"
                      style={{ cursor: 'pointer', zIndex: 10, color: '#6c757d' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </span>
                  </div>

                  <div className="form-floating mb-4 position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      id="confirmPass"
                      placeholder="Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <label htmlFor="confirmPass">Confirm Password</label>
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-3"
                      style={{ cursor: 'pointer', zIndex: 10, color: '#6c757d' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </span>
                  </div>

                  <Buttons type="submit" className="w-100 py-3 shadow-sm" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "RESET PASSWORD"}
                  </Buttons>
                </form>
              </>
            ) : (
              // Màn hình thành công (Giữ nguyên)
              <div className="text-center">
                <div className="mb-4 mx-auto d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: '#e8f5e9' }}>
                  <i className="bi bi-check-lg fs-1" style={{ color: COLORS.PRIMARY }}></i>
                </div>
                <h3 className="fw-bold text-dark">Password Changed!</h3>
                <p className="text-muted mb-4">Your password has been updated successfully.</p>
                <Buttons className="w-100 py-2" onClick={() => navigate('/login')}>
                  Back to Login Now
                </Buttons>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;