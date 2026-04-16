import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Dashboard = () => {
    // Hook này trả về trực tiếp user object (không phải { currentUser })
    const currentUser = useCurrentUser();

    // Nếu chưa có dữ liệu user thì không render gì cả
    if (!currentUser) return null;

    // Phân quyền chuyển hướng
    const isAdmin = currentUser?.permissions?.isAdmin;
    const isManager = currentUser?.permissions?.isManager;
    const isHousekeeper = currentUser?.permissions?.isHousekeeper;

    if (isAdmin || isManager) {
        // Manager và Admin vào trang báo cáo doanh thu đa cơ sở
        return <Navigate to="/report/multi-branch" replace />;
    } else if (isHousekeeper) {
        // Housekeeper (nhân viên dọn phòng) vào thẳng Housekeeping
        return <Navigate to="/housekeeping" replace />;
    } else {
        // Staff vào thẳng Front Desk (Lễ tân)
        return <Navigate to="/manager-booking" replace />;
    }
};

export default Dashboard;