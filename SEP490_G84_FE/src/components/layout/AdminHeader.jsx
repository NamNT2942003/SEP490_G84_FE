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

    // 动态页面标题映射
    const pageTitle = (() => {
        const path = location.pathname;
        if (path.includes('/admin/rooms')) return 'Room Management';
        if (path.includes('/admin/furniture')) return 'Furniture Management';
        if (path.includes('/accounts')) return 'Account Management';
        if (path.includes('/booking')) return 'Booking Management';
        if (path.includes('/inventoryandfurnitureTest/report')) return 'Inventory Report';
        if (path.includes('/inventoryandfurnitureTest')) return 'Item Inventory';
        if (path.includes('/reports')) return 'Reports';
        if (path.includes('/dashboard')) return 'Dashboard';
        return 'Dashboard'; // 默认值
    })();

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

            {/* Title / Breadcrumb */}
            <div className="d-flex align-items-center">
                <h4 className="m-0 fw-bold" style={{ color: COLORS.PRIMARY }}>{pageTitle}</h4>
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
                    onClick={handleLogout}
                >
                    {APP_STRINGS.BUTTONS.LOGOUT || 'Logout'}
                </Buttons>
            </div>
        </header>
    );
};

export default Header;

