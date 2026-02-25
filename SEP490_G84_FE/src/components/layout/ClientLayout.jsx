import React from 'react';
import Header from './Header'; // Header Public vừa sửa nãy
 import Footer from './Footer'; 

const ClientLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 100px)' }}>
        {children}
      </main>
      <Footer /> 
    </>
  );
};

export default ClientLayout;