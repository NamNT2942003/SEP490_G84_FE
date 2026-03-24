import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader'; // Nhớ đổi đúng tên Header bạn đang dùng
import AdminFooter from './AdminFooter';

const layoutMain = {
    display: 'grid',
    gridTemplateColumns: '260px 1fr', // Cột trái 260px (Sidebar), cột phải là phần còn lại (1fr)
    height: '100vh',                  // BẮT BUỘC: Khóa cứng chiều cao vừa đúng 1 màn hình
    overflowY: 'auto',               // Không cho phép cuộn toàn trang
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
    height: '100%', // Kế thừa 100vh từ cha
    minWidth: 0,    // Chống lỗi tràn chiều ngang (overflow blowout) của Grid
};

const layoutContent = {
    flex: 1,           // Tự động đẩy Header lên trên và Footer xuống dưới đáy
    overflowY: 'auto', // BẮT BUỘC: Chỉ xuất hiện thanh cuộn ở khu vực nội dung
    padding: '24px',   // Cách lề cho đẹp
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