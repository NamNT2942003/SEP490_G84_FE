import React from "react";
import { NavLink } from "react-router-dom"; // Dùng NavLink để tự động highlight menu đang chọn
import { COLORS } from "@/constants";

const Sidebar = () => {
  // Danh sách menu dựa trên SRS
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    {
      path: "/bookings",
      label: "Booking Management",
      icon: "bi-calendar-check",
    },
    { path: "/rooms", label: "Room List", icon: "bi-door-open" },
    { path: "/services", label: "Services", icon: "bi-cup-hot" },
    { path: "/staff", label: "Staff Account", icon: "bi-people" }, // Chỉ hiện nếu là Admin
    { path: "/reports", label: "Reports", icon: "bi-bar-chart-line" },
  ];

  return (
    <div
      className="d-flex flex-column flex-shrink-0 p-3 text-white vh-100"
      style={{ width: "280px", backgroundColor: COLORS.PRIMARY }}
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
                  : "transparent", // Hiệu ứng khi chọn
                fontWeight: isActive ? "bold" : "normal",
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
