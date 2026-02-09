import React from 'react';
import { useDispatch } from 'react-redux'; // 1. Hook để gọi Action
import { useNavigate } from 'react-router-dom'; // 2. Hook để chuyển trang
import { logout } from '@/features/auth/authSlice'; // 3. Import Action Logout
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
    // Bước 1: Hỏi xác nhận (Tùy chọn, cho chuyên nghiệp)
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      
      // Bước 2: Bắn action logout lên Redux 
      // (Nó sẽ tự xóa token trong localStorage và reset state user về null)
      dispatch(logout());

      // Bước 3: Đá người dùng về trang Login ngay lập tức
      navigate('/login');
    }
  };

  return (
    <header className="py-3 px-4 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center">
      
      {/* Title / Breadcrumb */}
      <div className="d-flex align-items-center">
        <h4 className="m-0 fw-bold" style={{ color: COLORS.PRIMARY }}>Dashboard</h4>
      </div>

      {/* Right Actions */}
      <div className="d-flex align-items-center gap-3">
       
        {/* Thanh ngăn cách dọc */}
        <div className="border-start mx-2" style={{height: '24px'}}></div>

        {/* Nút Logout */}
        <Buttons 
          variant="outline" 
          className="btn-sm py-1 px-3"
          icon={<i className="bi bi-box-arrow-right"></i>}
          onClick={handleLogout} // <--- Gắn hàm xử lý vào đây
        >
          {APP_STRINGS.BUTTONS.LOGOUT || 'Logout'}
        </Buttons>
      </div>
    </header>
  );
};

export default Header;