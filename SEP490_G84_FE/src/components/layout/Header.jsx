import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/features/auth/authSlice';
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';
import Swal from 'sweetalert2';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountsPage = location.pathname === '/accounts' || location.pathname.startsWith('/accounts/');
  const pageTitle = isAccountsPage ? 'Account List' : 'Dashboard';

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of the system.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(logout());
        navigate('/login');
      }
    });
  };

  return (
    <header className="layout-header">
      <div>
        <h4 style={{ margin: 0, fontWeight: 700, color: '#465c47' }}>{pageTitle}</h4>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 1, height: 24, background: '#d1d5db', margin: '0 0.5rem' }} />
        <Buttons
          variant="outline"
          className="btn-sm py-1 px-3"
          icon={<i className="bi bi-box-arrow-right" />}
          onClick={handleLogout}
        >
          {APP_STRINGS.BUTTONS.LOGOUT || 'Logout'}
        </Buttons>
      </div>
    </header>
  );
};

export default Header;