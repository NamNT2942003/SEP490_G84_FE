import React from 'react';
import Sidebar from './Sidebar';
<<<<<<< Updated upstream
import Header from './Header';
import Footer from './Footer';
=======
import AdminHeader from './AdminHeader'; // Nhớ đổi đúng tên Header bạn đang dùng
import AdminFooter from './AdminFooter';

const layoutMain = {
    display: 'grid',
    gridTemplateColumns: '260px 1fr', // Cột trái 260px (Sidebar), cột phải là phần còn lại (1fr)
    height: '100vh',                  // BẮT BUỘC: Khóa cứng chiều cao vừa đúng 1 màn hình
    overflow: 'hidden',               // Không cho phép cuộn toàn trang
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
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '24px',
    background: '#f4f6f9',
    minHeight: 0,
};
>>>>>>> Stashed changes

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Cố định Sidebar bên trái */}
      <Sidebar />
      
      {/* Phần nội dung bên phải (Header + Content + Footer) */}
      <div className="d-flex flex-column flex-grow-1 overflow-auto">
        <Header />
        
        {/* Nội dung thay đổi của từng trang nằm ở đây */}
        <main className="p-4 flex-grow-1 bg-light">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;