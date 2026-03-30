import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { COLORS } from "@/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const Sidebar = () => {
  // Đã cập nhật lại `path` để khớp với AppRouter.jsx (giữ nguyên cấu trúc menu gốc)
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/admin/rooms", label: "Room Management", icon: "bi-door-open" },
    { path: "/admin/furniture", label: "Furniture Management", icon: "bi-lamp" },
    { path: "/accounts", label: "Account Management", icon: "bi-people" },
    { path: "/bookings", label: "Booking Management", icon: "bi-calendar-check" },
    { path: "/services", label: "Services", icon: "bi-cup-hot" },
    { path: "/reports", label: "Reports", icon: "bi-bar-chart-line" },
  ];

  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileRoute = location.pathname.startsWith("/profile");

  /** Staff: hide service & account management (routes already redirect via AppRouter) */
  const STAFF_HIDDEN_PATHS = ["/services", "/accounts"];

  const visibleMenuItems =
    currentUser?.permissions?.isStaff
      ? menuItems.filter((item) => !STAFF_HIDDEN_PATHS.includes(item.path))
      : menuItems;

  const initials =
    (currentUser?.fullName || currentUser?.username || "AN")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

  const handleViewProfile = () => navigate("/profile");
  const handleEditProfile = (e) => {
    e.stopPropagation();
    navigate("/profile/edit");
  };

  return (
      <div
          className="d-flex flex-column flex-shrink-0 p-3 text-white"
          style={{ width: "100%", height: "100%", backgroundColor: COLORS.PRIMARY, paddingBottom: 0 }}
      >
        {/* Menu List */}
        <ul
          className={`nav nav-pills flex-column ${isProfileRoute ? "flex-grow-1" : "mb-auto"}`}
          style={isProfileRoute ? { overflowY: "auto" } : undefined}
        >
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

        {/* THÊM: user profile mini ở đáy sidebar */}
        <div style={isProfileRoute ? { marginTop: "auto" } : undefined}>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.18)",
              margin: "10px -12px 10px",
            }}
          />

          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={handleViewProfile}
              title="View Profile"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 0,
                margin: 0,
                background: "transparent",
                border: "none",
                color: "#fff",
                height: 44,
                cursor: "pointer",
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontWeight: 600,
                  flex: "0 0 auto",
                }}
              >
                {initials}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <strong style={{ fontSize: 13, lineHeight: 1.2, margin: 0 }}>
                  {currentUser?.fullName || "User"}
                </strong>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.1, marginTop: 2 }}>
                  {currentUser?.role || ""}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleEditProfile}
              title="Update Profile"
              style={{
                flex: "0 0 auto",
                width: 36,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <i className="bi bi-pencil-square" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      </div>
  );
};

export default Sidebar;
