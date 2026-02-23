import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/features/auth/authSlice'; // 3. Import Action Logout
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountsPage = location.pathname === '/accounts' || location.pathname.startsWith('/accounts/');
  const pageTitle = isAccountsPage ? 'Account List' : 'Dashboard';

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <header className="py-3 px-4 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center">
      
      {/* Title / Breadcrumb */}
      <div className="d-flex align-items-center">
        <h4 className="m-0 fw-bold" style={{ color: COLORS.PRIMARY }}>{pageTitle}</h4>
      </div>

      {/* Right Actions */}
      <div className="d-flex align-items-center gap-3">
       
        <div className="border-start mx-2" style={{height: '24px'}}></div>
        <Buttons 
          variant="outline" 
          className="btn-sm py-1 px-3"
          icon={<i className="bi bi-box-arrow-right"></i>}
          onClick={handleLogout}
        >
          {APP_STRINGS.BUTTONS.LOGOUT || 'Logout'}
        </Buttons>
      </div>
    </header>
  );
};

export default Header;