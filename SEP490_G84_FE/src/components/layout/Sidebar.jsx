import React from 'react';
import { NavLink } from 'react-router-dom'; // Dùng NavLink để tự động highlight menu đang chọn
import { COLORS } from '@/constants';

const Sidebar = () => {
  // Danh sách menu dựa trên SRS
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/bookings', label: 'Booking Management', icon: 'bi-calendar-check' },
    { path: '/rooms', label: 'Room List', icon: 'bi-door-open' },
    { path: '/services', label: 'Services', icon: 'bi-cup-hot' },
    { path: '/staff', label: 'Staff Account', icon: 'bi-people' }, // Chỉ hiện nếu là Admin
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
        <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="" alt="" width="32" height="32" className="rounded-circle me-2" />
          <strong>Manager</strong>
        </a>
        <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><a className="dropdown-item" href="#">Profile</a></li>
          <li><a className="dropdown-item" href="#">Settings</a></li>
          <li><hr className="dropdown-divider" /></li>
          <li><a className="dropdown-item" href="#">Sign out</a></li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;