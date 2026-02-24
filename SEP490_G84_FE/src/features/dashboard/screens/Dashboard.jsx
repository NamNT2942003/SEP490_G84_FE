import React, { useState } from 'react'; 
import { jwtDecode } from "jwt-decode"; 
import { COLORS } from '@/constants';

const Dashboard = () => {
  // --- Lazy Initialization ---
  const [userInfo] = useState(() => {
    const token = localStorage.getItem("accessToken");
    let initialUser = { fullName: 'User', role: 'User', branchName: '' };

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const roleList = (decoded.role || "").split(",");
        let mainRole = roleList.find(r => r.includes("ROLE_")) || roleList[0] || "User";
        let roleDisplay = mainRole.replace("ROLE_", "").toLowerCase();
        roleDisplay = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1); 
        initialUser = {
          fullName: decoded.fullName || "User",
          role: roleDisplay,
          branchName: decoded.branchName || ""
        };
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
    return initialUser;
  });

  return (
    <div className="container-fluid p-0 fade-in">
      {/* Welcome Banner */}
      <div className="p-4 rounded-3 shadow-sm bg-white border mb-4">
        <h2 className="fw-bold mb-2" style={{ color: COLORS.PRIMARY }}>
          Welcome back, {userInfo.role} {userInfo.branchName ? `- ${userInfo.branchName}` : ''}!
        </h2>
        <p className="text-muted fs-5 m-0">
          Hello <strong>{userInfo.fullName}</strong>, wishing you a productive day.
        </p>
      </div>

      {/* Dashboard Content */}
      <div className="row g-4">
        {/* Example Card 1 */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase" style={{fontSize: '12px'}}>Total Bookings Today</h6>
              <h3 className="fw-bold my-2">24</h3>
            </div>
          </div>
        </div>

        {/* Example Card 2 */}
        
      </div>
    </div>
  );
};

export default Dashboard;