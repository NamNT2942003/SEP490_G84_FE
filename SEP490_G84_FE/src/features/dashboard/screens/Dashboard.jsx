import React from 'react';
import { COLORS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser'; // Import đường ống vừa tạo

const Dashboard = () => {
    // Hút data từ Redux ra xài
    const { currentUser } = useCurrentUser();
    
    // Nếu chưa load kịp thì để tạm giá trị rỗng để tránh lỗi sập app
    const userInfo = currentUser || { fullName: 'User', roleDisplay: 'User', branchName: '' };

    return (
        <div className="container-fluid p-0 fade-in">
            <div className="p-4 rounded-3 shadow-sm bg-white border mb-4">
                <h2 className="fw-bold mb-2" style={{ color: COLORS.PRIMARY }}>
                    Welcome back, {userInfo.roleDisplay} {userInfo.branchName ? `- ${userInfo.branchName}` : ''}!
                </h2>
                <p className="text-muted fs-5 m-0">
                    Hello <strong>{userInfo.fullName}</strong>, wishing you a productive day.
                </p>
            </div>
            {/* Các thẻ div khác giữ nguyên */}
        </div>
    );
};

export default Dashboard;