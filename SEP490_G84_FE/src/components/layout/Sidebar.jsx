import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice';

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      dispatch(logout());
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/bookings', label: 'Booking Management', icon: 'bi-calendar-check' },
    { path: '/rooms', label: 'Room List', icon: 'bi-door-open' },
    { path: '/services', label: 'Services', icon: 'bi-cup-hot' },
    { path: '/accounts', label: 'Account List', icon: 'bi-people' },
    { path: '/reports', label: 'Reports', icon: 'bi-bar-chart-line' },
  ];

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
        <span style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>An Nguyen</span>
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

      <div className="sidebar-user-group" style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', color: 'white', padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
          aria-expanded="false"
          aria-haspopup="true"
        >
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', flexShrink: 0 }} />
          <strong>Manager</strong>
        </button>
        <div className="sidebar-dropdown">
          <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>Profile</NavLink>
          <NavLink to="/accounts" style={{ textDecoration: 'none' }}>Account List</NavLink>
          <hr style={{ borderColor: '#4b5563', margin: '4px 0' }} />
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;