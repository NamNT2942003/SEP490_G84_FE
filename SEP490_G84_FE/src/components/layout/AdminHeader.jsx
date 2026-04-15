import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/features/auth/authSlice';
import { COLORS, APP_STRINGS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser.js';
import { profileAPI } from '@/features/profile/api/profileApi';
import apiClient from '@/services/apiClient';
import Swal from 'sweetalert2';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/manager-booking': 'Front Desk',
    '/stay': 'In-house Guests',
    '/housekeeping': 'Housekeeping',
    '/bookings': 'Booking Management',
    '/services': 'Services',
    '/admin/branches': 'Branches',
    '/admin/rooms': 'Room Management',
    '/admin/room-types': 'Room Types',
    '/admin/room-inventories': 'Room Inventories',
    '/admin/furniture': 'Furniture Master',
    '/inventory': 'Main Inventory',
    '/furniture/furniture': 'Furniture Inventory',
    '/furniture/history': 'Import History',
    '/furniture/report': 'Inventory Report',
    '/accounts': 'Accounts',
    '/profile': 'My Profile',
    '/profile/edit': 'Edit Profile',
    '/report/revenue': 'Room Revenue',
    '/report/services': 'Service Revenue',
    '/report/expense': 'Operating Expenses',
    '/report/aggregated': 'Aggregated Report',
    '/report/multi-branch': 'Multi-Branch Report',
    '/finance/cashflow': 'Cash Flow Report',
};

const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/api/')) {
        const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, '');
        return baseUrl + url;
    }
    return url;
};

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useCurrentUser();

    const [avatarUrl, setAvatarUrl] = useState(null);

    // Fetch user profile on mount to get avatar
    useEffect(() => {
        const fetchAvatar = async () => {
            try {
                const res = await profileAPI.getMyProfile();
                if (res.data?.image) {
                    setAvatarUrl(getAbsoluteImageUrl(res.data.image));
                }
            } catch {
                // silently ignore - fallback to initials
            }
        };
        if (currentUser) fetchAvatar();
    }, [currentUser]);

    const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of the system.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: COLORS.PRIMARY,
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

    const initials = (currentUser?.fullName || currentUser?.username || 'AN')
        .split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

    return (
        <header className="py-3 px-4 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center">
            {/* Page Title */}
            <div className="d-flex align-items-center gap-2">
                
            </div>

            {/* Right Actions */}
            <div className="d-flex align-items-center gap-3">
                {/* User quick info */}
                <div
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/profile')}
                    title="View Profile"
                >
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: 34, height: 34,
                            backgroundColor: COLORS.PRIMARY,
                            fontSize: 12, fontWeight: 600, color: '#fff',
                            overflow: 'hidden', flexShrink: 0,
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => setAvatarUrl(null)}
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <span className="fw-semibold small text-dark d-none d-md-inline">
                        {currentUser?.fullName || currentUser?.username || 'User'}
                    </span>
                </div>

                <div className="border-start mx-1" style={{ height: '24px' }}></div>

                {/* Logout */}
                <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={handleLogout}
                    style={{ borderRadius: '6px' }}
                >
                    <i className="bi bi-box-arrow-right"></i>
                    <span className="d-none d-sm-inline">{APP_STRINGS.BUTTONS.LOGOUT || 'Sign Out'}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;