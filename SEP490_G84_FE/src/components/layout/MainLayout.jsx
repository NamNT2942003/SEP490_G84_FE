import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 64;

const MainLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `${sidebarWidth}px 1fr`,
                height: '100vh',
                overflow: 'hidden',
                background: '#f3f4f6',
                transition: 'grid-template-columns 0.3s ease',
            }}
        >
            {/* LEFT: Sidebar */}
            <aside
                style={{
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                <Sidebar collapsed={collapsed} />

                {/* Toggle button — pinned at the right edge of sidebar */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        right: '-14px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '2px solid #e0e0e0',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        fontSize: '0.75rem',
                        color: '#555',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
                </button>
            </aside>

            {/* RIGHT: Header + Content + Footer */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                <AdminHeader />

                <main
                    className="fade-in"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        background: '#f4f6f9',
                        minHeight: 0,
                    }}
                >
                    {children}
                </main>

                <AdminFooter />
            </div>
        </div>
    );
};

export default MainLayout;