import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { APP_STRINGS } from '@/constants';

const Sidebar = () => {
  const currentUser = useCurrentUser();

  const displayRole = currentUser?.role
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase()
    : '';

  const hotelName = APP_STRINGS.APP_NAME;

  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/bookings', label: 'Booking Management', icon: 'bi-calendar-check' },
    { path: '/rooms', label: 'Room List', icon: 'bi-door-open' },
    { path: '/services', label: 'Services', icon: 'bi-cup-hot', staffCannotAccess: true },
    { path: '/accounts', label: 'Account List', icon: 'bi-people', staffCannotAccess: true },
    { path: '/reports', label: 'Reports', icon: 'bi-bar-chart-line' },
  ];

  const menuItems = currentUser?.permissions?.isStaff
    ? allMenuItems.filter((item) => !item.staffCannotAccess)
    : allMenuItems;

  const asideStyle = {
    width: 260,
    minHeight: '100vh',
    background: '#465c47',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    boxSizing: 'border-box',
  };
  const logoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    color: 'white',
    textDecoration: 'none',
  };
  const logoBoxStyle = { width: 40, height: 40, borderRadius: '50%', background: 'white', overflow: 'hidden', flexShrink: 0 };
  const navStyle = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 };

  return (
    <aside className="sidebar-wrap" style={asideStyle}>
      <a href="/" style={logoRowStyle}>
        <div style={logoBoxStyle}>
          <img src="/logo2.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>{hotelName}</span>
      </a>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '8px 0' }} />

      <nav style={navStyle}>
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => 'sidebar-nav-link' + (isActive ? ' active' : '')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white', padding: '10px 12px', borderRadius: 8, textDecoration: 'none' }}
          >
            <i className={`bi ${item.icon}`} style={{ fontSize: 18 }} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '8px 0' }} />

      <div className="sidebar-user-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'white' }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', flexShrink: 0 }} />
        <strong>{displayRole || 'User'}</strong>
      </div>
    </aside>
  );
};

export default Sidebar;