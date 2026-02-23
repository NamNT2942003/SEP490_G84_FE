import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice';
import { COLORS } from '@/constants';

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

  return (
    <div 
      className="d-flex flex-column flex-shrink-0 p-3 text-white vh-100" 
      style={{ width: '280px', backgroundColor: COLORS.PRIMARY }}
    >
      {/* Logo Area */}
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: 40, height: 40}}>
         <img src="./public/logo2.jpg" alt="Logo" style={{width: 50, height: 50,
    borderRadius: '50%',
    objectFit: 'cover'} } />
        </div>
        <span className="fs-5 fw-bold text-uppercase">An Nguyen</span>
      </a>
      
      <hr />
      
      {/* Menu List */}
      <ul className="nav nav-pills flex-column mb-auto">
        {menuItems.map((item, index) => (
          <li className="nav-item mb-1" key={index}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => 
                `nav-link text-white d-flex align-items-center ${isActive ? 'active-menu' : ''}`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent', // Hiệu ứng khi chọn
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              <i className={`bi ${item.icon} me-3 fs-5`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      
      <hr />
      
      {/* User Info Mini */}
      <div className="dropdown">
        <button type="button" className="btn btn-link d-flex align-items-center text-white text-decoration-none dropdown-toggle p-0 border-0" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <span className="rounded-circle bg-white me-2 d-inline-block" style={{ width: 32, height: 32 }} />
          <strong>Manager</strong>
        </button>
        <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><NavLink className="dropdown-item" to="/dashboard">Profile</NavLink></li>
          <li><NavLink className="dropdown-item" to="/accounts">Account List</NavLink></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button type="button" className="dropdown-item bg-transparent border-0 w-100 text-start" onClick={handleSignOut}>Sign out</button></li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;