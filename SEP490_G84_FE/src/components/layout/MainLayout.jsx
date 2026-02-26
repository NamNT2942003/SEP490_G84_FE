import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

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