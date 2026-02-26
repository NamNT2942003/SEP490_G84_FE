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
    <div className="min-h-screen w-full p-0 overflow-hidden">
      <div className="flex h-full">
        {/* Left column */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative text-white">
          <div className="absolute inset-0 bg-brand z-[1]" />
          <img src="/assets/hotel-preview.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-20 z-0" />
          <div className="relative text-center p-8 z-10">
            <h2 className="font-bold uppercase mb-2 text-xl">{APP_STRINGS.APP_NAME}</h2>
            <p className="text-lg opacity-75">Password Recovery Service</p>
          </div>
        </div>

        {/* Right column - form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white">
          <div className="w-full p-8 max-w-[500px]">
            <div className="mb-6 text-start">
              <Buttons
                variant="text"
                className="p-0"
                onClick={() => navigate('/login')}
                icon={<i className="bi bi-arrow-left" />}
              >
                Back to Login
              </Buttons>
            </div>
            {!isSubmitted ? (
              <>
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 text-xl">Forgot Password?</h3>
                  <p className="text-gray-500 mt-1">Enter your email to receive reset instructions.</p>
                  {error && (
                    <div className="mt-2 p-2 text-center text-sm text-red-600 bg-red-50 rounded" role="alert">
                      <i className="bi bi-exclamation-circle me-2" />
                      {error}
                    </div>
                  )}
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-600 mb-1">Enter your email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
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
                  </div>

                  <Buttons
                    type="submit"
                    className="w-full py-3 shadow-sm mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      'SEND RESET LINK'
                    )}
                  </Buttons>
                </form>
              </>
            ) : (
              /* Màn hình thành công (Giữ nguyên logic của bạn) */
              <div className="text-center">
                <div className="mb-6 mx-auto flex items-center justify-center rounded-full w-20 h-20 bg-green-100">
                  <i className="bi bi-check-lg text-4xl text-brand" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl">Check your inbox</h3>
                <p className="text-gray-500 mb-6 mt-2">Email sent to: <strong>{email}</strong></p>
                <p className="text-sm text-gray-500 mb-4">Please check your email and click on the provided link to reset your password.</p>
                <Buttons className="w-full py-2" onClick={() => navigate('/login')}>
                  Back to Login
                </Buttons>
              </div>
            )}

            <div className="mt-8 text-center text-gray-500 text-[11px]">
              {APP_STRINGS.FOOTER}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;