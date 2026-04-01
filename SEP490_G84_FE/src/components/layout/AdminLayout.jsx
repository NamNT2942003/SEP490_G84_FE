import React from 'react';
import Sidebar from './Sidebar';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout d-flex vh-100 overflow-hidden">
      {/* Fixed Sidebar on the left */}
      <Sidebar />
      
      {/* Content area on the right */}
      <div className="admin-content d-flex flex-column flex-grow-1 overflow-auto">
        {/* Main content area */}
        <main className="admin-main flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
