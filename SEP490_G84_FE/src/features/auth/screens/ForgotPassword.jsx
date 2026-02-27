import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons.jsx';
import { APP_STRINGS, COLORS } from '@/constants';
import { forgotPass } from '../api/forgotPass';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Reset lại lỗi và bật loading
    setError(null);
    setIsLoading(true);
    try {
      // --- 3. Gọi API ---
      await forgotPass.forgotPassword(email);
      // Nếu thành công -> Chuyển sang màn hình thông báo
      setIsSubmitted(true);
    } catch (err) {
      // Nếu lỗi -> Hiện thông báo (Lấy message từ Backend trả về hoặc text mặc định)
      const msg = err.response?.data || "An error occurred, please try again.";
      setError(msg);
    } finally {
      // Tắt loading dù thành công hay thất bại
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
            <p className="lead opacity-75">Password Recovery Service</p>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '500px' }}>

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

            {!isSubmitted ? (
              <>
                <div className="mb-4">
                  <h3 className="fw-bold text-dark">Forgot Password?</h3>
                  <p className="text-muted">Enter your email to receive reset instructions.</p>

                  {/* --- 4. HIỂN THỊ LỖI NẾU CÓ --- */}
                  {error && (
                    <div className="alert alert-danger p-2 small text-center" role="alert">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-4">
                    <input
                      type="email"
                      className="form-control"
                      id="resetEmail"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if(error) setError(null); // Xóa lỗi khi người dùng nhập lại
                      }}
                      required
                      disabled={isLoading} // Khóa input khi đang gửi
                    />
                    <label htmlFor="resetEmail" className="text-muted">Enter your email</label>
                  </div>

                  <Buttons
                    type="submit"
                    className="w-100 py-3 shadow-sm mb-3"
                    disabled={isLoading} // Khóa nút khi đang gửi
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      "SEND RESET LINK"
                    )}
                  </Buttons>
                </form>
              </>
            ) : (
              /* Màn hình thành công (Giữ nguyên logic của bạn) */
              <div className="text-center">
                <div className="mb-4 mx-auto d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: '#e8f5e9' }}>
                  <i className="bi bi-check-lg fs-1" style={{ color: COLORS.PRIMARY }}></i>
                </div>
                <h3 className="fw-bold text-dark">Check your inbox</h3>
                <p className="text-muted mb-4">Email sent to: <strong>{email}</strong></p>
                <p className="small text-muted">Please check your email and click on the provided link to reset your password.</p>

                <Buttons
                  className="w-100 py-2"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Buttons>
              </div>
            )}

            <div className="mt-5 text-center text-muted" style={{ fontSize: '11px' }}>
              {APP_STRINGS.FOOTER}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;