import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
const Dashboard = () => {
  const [userInfo] = useState(() => {
    const token = localStorage.getItem('accessToken');
    let initialUser = { fullName: 'User', role: 'User', branchName: '' };

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const roleList = (decoded.role || '').split(',');
        const mainRole = roleList.find((r) => r.includes('ROLE_')) || roleList[0] || 'User';
        let roleDisplay = mainRole.replace('ROLE_', '').toLowerCase();
        roleDisplay = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);
        initialUser = {
          fullName: decoded.fullName || decoded.sub || decoded.username || 'User',
          role: roleDisplay,
          branchName: decoded.branchName || '',
        };
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    return initialUser;
  });

  return (
    <div style={{ width: '100%' }}>
      <div className="dashboard-card">
        <h2>Welcome back, {userInfo.role} {userInfo.branchName ? `- ${userInfo.branchName}` : ''}!</h2>
        <p className="muted">Hello <strong>{userInfo.fullName}</strong>, have a productive day.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <h6>Today&apos;s total bookings</h6>
          <h3>24</h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;