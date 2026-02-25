import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/features/auth/authSlice';
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';
import Swal from 'sweetalert2';

const AdminHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    <header className="py-3 px-4 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <h4 className="m-0 fw-bold" style={{ color: COLORS.PRIMARY }}>Dashboard</h4>
      </div>

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

export default AdminHeader;