import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

const layoutMain = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  minHeight: '100vh',
  background: '#f3f4f6',
};
const layoutRight = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
};
const layoutContent = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: 16,
};

const MainLayout = ({ children }) => {
  return (
    <div style={layoutMain}>
      <Sidebar />
      <div style={layoutRight}>
        <AdminHeader />
        <main style={layoutContent}>
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
};

export default MainLayout;