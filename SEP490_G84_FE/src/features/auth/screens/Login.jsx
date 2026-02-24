import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // 1. Import Redux hooks
import { loginUser, clearError } from '../authSlice';   // 2. Import Action
import { APP_STRINGS, COLORS } from '@/constants';
import apiClient from '@/services/apiClient';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  // State form
  const [credentials, setCredentials] = useState({ email: '', password: '', rememberMe: false });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, token } = useSelector((state) => state.auth);
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials({
      ...credentials,
      [name]: type === 'checkbox' ? checked : value
    });
    // Xóa lỗi cũ khi user bắt đầu gõ lại
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginPayload = {
      username: credentials.email,
      password: credentials.password
    };
    dispatch(loginUser(loginPayload));
  };


const handleGoogleSuccess = async (credentialResponse) => {
    try {
        const token = credentialResponse.credential;
        const res = await apiClient.post('/auth/google', { token: token });
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        window.location.href = '/dashboard';

    } catch (error) {
        console.error("Google login error:", error);
        alert("Google login failed.");
    }
  };


  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden">
      <div className="row g-0 h-100">
        
        {/* Left column - branding */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center position-relative text-white">
          <div className="position-absolute w-100 h-100" style={{ backgroundColor: COLORS.PRIMARY, zIndex: 1 }}></div>
          <div className="position-relative text-center p-5" style={{ zIndex: 2 }}>
            <h2 className="display-6 fw-bold text-uppercase mb-3" style={{ letterSpacing: '3px' }}>{APP_STRINGS.APP_NAME}</h2>
            <h5 className="fw-light text-uppercase mb-4" style={{ letterSpacing: '2px', opacity: 0.9 }}>{APP_STRINGS.APP_SUBTITLE}</h5>
            <hr className="w-25 mx-auto border-white opacity-75 mb-4" />
            <p className="lead fst-italic px-5" style={{ opacity: 0.8 }}>{APP_STRINGS.SLOGAN}</p>
          </div>
        </div>

        {/* Right column - form */}
        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '500px' }}>
            
            <div className="d-lg-none text-center mb-4">
               <h4 className="fw-bold mt-2 text-brand">AN NGUYEN</h4>
            </div>

            <div className="mb-4">
              <h3 className="fw-bold text-dark">Welcome Back</h3>
              <p className="text-muted">Please sign in to your staff account.</p>
              
              {/* Error message */}
              {error && (
                  <div className="alert alert-danger py-2" role="alert">
                      <small>{typeof error === 'string' ? error : 'Login failed'}</small>
                  </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    name="email"
                    placeholder="name@example.com" 
                    value={credentials.email} 
                    onChange={handleChange} 
                    required 
                />
                <label htmlFor="floatingInput" className="text-muted">Username or Email</label>
              </div>

             <div className="form-floating mb-3 position-relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-control" 
                    id="floatingPassword" 
                    name="password" 
                    placeholder="Password" 
                    value={credentials.password} 
                    onChange={handleChange} 
                    required 
                    style={{ paddingRight: '40px' }} 
                />
                <label htmlFor="floatingPassword">Password</label>
                
                {/* Nút con mắt */}
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ cursor: 'pointer', zIndex: 10, color: '#6c757d' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </span>
              </div>

              {/* Remember me & Forgot password */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" name="rememberMe" checked={credentials.rememberMe} onChange={handleChange} />
                  <label className="form-check-label text-muted small" htmlFor="rememberMe">{APP_STRINGS.BUTTONS.REMEMBER_ME}</label>
                </div>
                <span className="link-brand" onClick={() => navigate('/forgot-password')}>
                  {APP_STRINGS.BUTTONS.FORGOT_PASS}
                </span>
              </div>

              {/* Login button */}
              <button 
                type="submit" 
                className="btn btn-brand btn-lg w-100 py-3 shadow-sm mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                    <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Checking...
                    </span>
                ) : (
                    APP_STRINGS.BUTTONS.LOGIN
                )}
              </button>

              <div className="d-flex justify-content-center mt-3 w-100">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap
            shape="rectangular"
            width="300"
          />
      </div>


            </form>

            <div className="mt-5 text-center text-muted" style={{ fontSize: '11px' }}>
              {APP_STRINGS.COPYRIGHT}<br/>{APP_STRINGS.FOOTER}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;