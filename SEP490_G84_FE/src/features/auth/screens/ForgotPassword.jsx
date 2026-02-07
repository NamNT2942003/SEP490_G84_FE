import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Import đúng theo tên file bạn đặt (Buttons.jsx) và dùng Alias @
import Buttons from '@/components/ui/Buttons.jsx'; 
import { APP_STRINGS, COLORS } from '@/constants'; // Dùng @ luôn cho đồng bộ

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset password for:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden">
      <div className="row g-0 h-100">
        
        {/* CỘT TRÁI (Branding) */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center position-relative text-white">
          <div className="position-absolute w-100 h-100" style={{ backgroundColor: COLORS.PRIMARY, zIndex: 1 }}></div>
          <img src="/assets/hotel-preview.png" alt="Background" className="position-absolute w-100 h-100" style={{ objectFit: 'cover', opacity: 0.2, zIndex: 0 }} />
          <div className="position-relative text-center p-5" style={{ zIndex: 2 }}>
            
            <h2 className="fw-bold text-uppercase mb-2">{APP_STRINGS.APP_NAME}</h2>
            <p className="lead opacity-75">Password Recovery Service</p>
          </div>
        </div>

        {/* CỘT PHẢI (Form) */}
        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '500px' }}>
            
            <div className="mb-4 text-start">
  <Buttons 
    variant="text" // Dùng variant text để bỏ màu nền
    className="p-0" // Bỏ padding để nó gọn như văn bản
    onClick={() => navigate('/login')}
    icon={<i className="bi bi-arrow-left"></i>} // Icon mũi tên quay lại
  >
    Back to Login
  </Buttons>
</div>
            {!isSubmitted ? (
              <>
                <div className="mb-4">
                  <h3 className="fw-bold text-dark">Forgot Password?</h3>
                  <p className="text-muted">Enter your email to receive reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-4">
                    <input
                      type="email"
                      className="form-control"
                      id="resetEmail"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="resetEmail" className="text-muted">Enter your email</label>
                  </div>

                  {/* SỬ DỤNG COMPONENT BUTTONS VỚI TÊN MỚI */}
                  <Buttons 
                    type="submit" 
                    className="w-100 py-3 shadow-sm mb-3"
                  >
                    SEND RESET LINK
                  </Buttons>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4 mx-auto d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: '#e8f5e9' }}>
                  <i className="bi bi-check-lg fs-1" style={{ color: COLORS.PRIMARY }}></i>
                </div>
                <h3 className="fw-bold text-dark">Check your inbox</h3>
                <p className="text-muted mb-4">Email sent to: <strong>{email}</strong></p>
                
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