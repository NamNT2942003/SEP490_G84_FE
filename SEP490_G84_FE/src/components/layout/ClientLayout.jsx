import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ClientLayout = ({ children }) => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <main className="flex-fill">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default ClientLayout;