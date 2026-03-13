import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader'; // Nhớ đổi đúng tên Header bạn đang dùng
import AdminFooter from './AdminFooter';

const layoutMain = {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    minHeight: '100vh',
    background: '#f3f4f6',
};

// Bọc Sidebar lại để đảm bảo nó luôn lấp đầy 100% chiều cao cột trái
const sidebarWrapper = {
    height: '100%',
    overflowY: 'auto', // Nếu menu quá nhiều mục, nó sẽ tự có thanh cuộn riêng ở Sidebar
    display: 'flex',
    flexDirection: 'column'
};

const layoutRight = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
};

const layoutContent = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '24px',
    background: '#f4f6f9',
};

const MainLayout = ({ children }) => {
    return (
        <div style={layoutMain}>

            {/* CỘT TRÁI: Sidebar */}
            <aside style={sidebarWrapper}>
                <Sidebar />
            </aside>

            {/* CỘT PHẢI: Header + Nội dung + Footer */}
            <div style={layoutRight}>
                <AdminHeader />

                <main style={layoutContent} className="fade-in">
                    {children}
                </main>

                <AdminFooter />
            </div>

        </div>
    );
};

export default MainLayout;