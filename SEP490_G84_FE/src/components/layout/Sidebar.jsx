import React from "react";
import { NavLink } from "react-router-dom";
import { COLORS } from "@/constants";
// 1. Import hook lấy thông tin user
import { useCurrentUser } from "@/hooks/useCurrentUser.js";

const Sidebar = () => {
  // 2. Lấy thông tin user và permissions hiện tại
  const currentUser = useCurrentUser();

  // 3. Định nghĩa menu kèm theo điều kiện hiển thị (thuộc tính `show`)
  const menuItems = [
    { 
      path: "/dashboard", 
      label: "Dashboard", 
      icon: "bi-speedometer2", 
      show: true // Ai đăng nhập vào dashboard cũng thấy
    },
    { 
      path: "/admin/rooms", 
      label: "Room Management", 
      icon: "bi-door-open", 
      // Ví dụ: Chỉ Admin hoặc Manager mới quản lý phòng
      show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager 
    },
    { 
      path: "/admin/furniture", 
      label: "Furniture Management", 
      icon: "bi-lamp", 
      // Ví dụ: Chỉ Admin hoặc Manager
      show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager 
    },
    { 
      path: "/accounts", 
      label: "Account Management", 
      icon: "bi-people", 
      // Khớp với logic ở AppRouter: Staff không được vào, hoặc check quyền canAccessAccountList
      show: currentUser?.permissions?.canAccessAccountList || !currentUser?.permissions?.isStaff
    },
    { 
      path: "/manager-booking", 
      label: "Check-in", 
      icon: "bi-key", 
      show: true // Lễ tân, Quản lý hay Admin đều thao tác được
    },
    // ---- ĐÂY LÀ MỤC STAY VỪA THÊM ----
    { 
      path: "/stay", // Đảm bảo em đã map "/stay" với StayScreen trong AppRouter nhé
      label: "In-house (Stay)", 
      icon: "bi-house-door", // Icon ngôi nhà hợp với khách đang lưu trú
      show: true // Hiển thị cho tất cả role (đặc biệt là lễ tân)
    },
    // -----------------------------------
    { 
      path: "/bookings", 
      label: "Booking Management", 
      icon: "bi-calendar-check", 
      show: true 
    },
    { 
      path: "/services", 
      label: "Services", 
      icon: "bi-cup-hot", 
      show: true 
    },
    { 
      path: "/reports", 
      label: "Reports", 
      icon: "bi-bar-chart-line", 
      // Ví dụ: Báo cáo nhạy cảm chỉ Admin mới được xem
      show: currentUser?.permissions?.isAdmin 
    },
  ];

  // 4. Lọc ra những menu hợp lệ trước khi render
  const visibleMenuItems = menuItems.filter(item => item.show !== false);

  return (
      <div
          className="d-flex flex-column flex-shrink-0 p-3 text-white"
          style={{ width: "100%", height: "100%", backgroundColor: COLORS.PRIMARY }}
      >
        <ul className="nav nav-pills flex-column mb-auto">
          {/* 5. Map qua mảng đã được lọc */}
          {visibleMenuItems.map((item, index) => (
              <li className="nav-item mb-1" key={index}>
                <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `nav-link text-white d-flex align-items-center ${isActive ? "active-menu" : ""}`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive
                          ? "rgba(255,255,255,0.2)"
                          : "transparent",
                      fontWeight: isActive ? "bold" : "normal",
                      transition: "background-color 0.2s ease" 
                    })}
                >
                  <i className={`bi ${item.icon} me-3 fs-5`}></i>
                  {item.label}
                </NavLink>
              </li>
          ))}
        </ul>
        <hr />
      </div>
  );
};

export default Sidebar;