import React from 'react';

const ClientLayout = ({ children }) => {
    return (
        <main style={{ minHeight: 'calc(100vh - 100px)' }}>
            {children}
        </main>
    );
};

export default ClientLayout;