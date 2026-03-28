import React from "react";
import { NavLink } from "react-router-dom";
import { COLORS } from "@/constants";

const Sidebar = () => {
  // Đã cập nhật lại `path` để khớp với AppRouter.jsx
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },

    // Đã đổi thành /admin/rooms thay vì /rooms (vì /rooms đang để Coming Soon)
    { path: "/admin/rooms", label: "Room Management", icon: "bi-door-open" },

    // Thêm mục Furniture Management có trong AppRouter
    { path: "/admin/furniture", label: "Furniture Management", icon: "bi-lamp" },

    // Thêm mục Branch Management có trong AppRouter
    { path: "/admin/branches", label: "Branch Management", icon: "bi-building" },

    // Thêm mục Room Type Management
    { path: "/admin/room-types", label: "Room Type Management", icon: "bi-grid-1x2" },


    // Thêm mục Inventory Management
    { path: "/admin/room-inventories", label: "Inventory Management", icon: "bi-calendar3-range" },

    // Đã đổi từ /staff thành /accounts cho khớp với Route
    { path: "/accounts", label: "Account Management", icon: "bi-people" },

    // --- CÁC TRANG CHƯA CÓ TRONG APPROUTER ---
    // (Bấm vào sẽ bị chuyển hướng về /login do dính catch-all Route "*")
    { path: "/bookings", label: "Booking Management", icon: "bi-calendar-check" },
    { path: "/services", label: "Services", icon: "bi-cup-hot" },
    { path: "/reports", label: "Reports", icon: "bi-bar-chart-line" },
  ];

  return (
      <div
          className="d-flex flex-column flex-shrink-0 p-3 text-white"
          style={{ width: "100%", height: "100%", backgroundColor: COLORS.PRIMARY }}
      >
        {/* Menu List */}
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item, index) => (
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
                      transition: "background-color 0.2s ease" // Thêm chút hiệu ứng mượt mà khi hover/click
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