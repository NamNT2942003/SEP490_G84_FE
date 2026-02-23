import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ pointerEvents: 'auto' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 overflow-auto" style={{ pointerEvents: 'auto' }}>
        <Header />
        {/* Main content area */}
        <main className="p-4 flex-grow-1 bg-light">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;