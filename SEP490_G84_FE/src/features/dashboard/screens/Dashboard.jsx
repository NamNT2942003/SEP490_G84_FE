import React, { useState } from 'react'; // Bỏ useEffect, không cần dùng nữa
import { jwtDecode } from "jwt-decode"; 
import { COLORS } from '@/constants';

const Dashboard = () => {
  // --- KỸ THUẬT LAZY INITIALIZATION ---
  // Code trong hàm này chỉ chạy ĐÚNG 1 LẦN khi trang được F5 hoặc load lần đầu.
  // Giúp hiển thị tên ngay lập tức mà không cần chờ đợi (Hết lỗi cascading).
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
          role: roleDisplay, // Kết quả sẽ chỉ là "Admin"
          branchName: decoded.branchName || ""
        };
      } catch (error) {
        console.error("Lỗi đọc token:", error);
      }
    }
    return initialUser;
  });
  return (
    <div className="container-fluid p-0 fade-in">
      {/* Banner Chào mừng */}
      <div className="p-4 rounded-3 shadow-sm bg-white border mb-4">
        <h2 className="fw-bold mb-2" style={{ color: COLORS.PRIMARY }}>
          Chào mừng quay trở lại, {userInfo.role} {userInfo.branchName ? `- ${userInfo.branchName}` : ''}!
        </h2>
        <p className="text-muted fs-5 m-0">
          Xin chào <strong>{userInfo.fullName}</strong>, chúc bạn một ngày làm việc hiệu quả.
        </p>
      </div>

      {/* Khu vực nội dung Dashboard */}
      <div className="row g-4">
        {/* Thẻ ví dụ 1 */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase" style={{fontSize: '12px'}}>Tổng Booking hôm nay</h6>
              <h3 className="fw-bold my-2">24</h3>
            </div>
          </div>
        </div>

         {/* Thẻ ví dụ 2 */}
         
      </div>
    </div>
  );
};

export default Dashboard;