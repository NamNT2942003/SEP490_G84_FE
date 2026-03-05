import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./AdminLayout.css";

const BRAND = "#5C6F4E";

const MENU = [
  { path: "/admin/rooms", label: "Room Management", icon: "bi-door-open" },
  { path: "/admin/furniture", label: "Furniture", icon: "bi-boxes" },
  { path: "/admin/bookings", label: "Bookings", icon: "bi-calendar-check" },
  { path: "/admin/staff", label: "Staff", icon: "bi-people" },
  { path: "/admin/services", label: "Services", icon: "bi-cup-hot" },
  {
    path: "/admin/reports",
    label: "Reports & Stats",
    icon: "bi-bar-chart-line",
  },
  { path: "/admin/settings", label: "Settings", icon: "bi-gear" },
];

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-wrapper">
      {/* ── Sidebar ── */}
      <aside
        className={`admin-sidebar ${sidebarCollapsed ? "admin-sidebar--collapsed" : ""}`}
      >
        {/* Brand */}
        <div className="admin-sidebar-brand">
          <Link to="/admin/rooms" className="text-decoration-none">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  fontSize: "1rem",
                  color: "#fff",
                }}
              >
                <i className="bi bi-building"></i>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div
                    className="fw-bold text-white"
                    style={{ fontSize: "0.9rem", letterSpacing: 1 }}
                  >
                    AN NGUYEN
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.65rem",
                      letterSpacing: 1,
                    }}
                  >
                    HOTEL MANAGEMENT
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-nav">
          <p className="admin-sidebar-section-label">
            {!sidebarCollapsed && "MAIN MENU"}
          </p>
          <ul className="list-unstyled mb-0">
            {MENU.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `admin-sidebar-link${isActive ? " admin-sidebar-link--active" : ""}`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <i className={`bi ${item.icon} admin-sidebar-icon`}></i>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="admin-sidebar-footer">
          <hr className="border-white opacity-25 my-0 mb-2" />
          <div className="d-flex align-items-center gap-2 px-1 mb-2">
            <div
              className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: 34,
                height: 34,
                backgroundColor: "rgba(255,255,255,0.2)",
                fontSize: "0.85rem",
              }}
            >
              A
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div
                  className="text-white fw-semibold"
                  style={{
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Administrator
                </div>
                <div
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
                >
                  admin@hotel.com
                </div>
              </div>
            )}
          </div>
          <Link
            to="/login"
            className="admin-sidebar-link text-decoration-none"
            style={{ marginTop: 0 }}
          >
            <i className="bi bi-box-arrow-left admin-sidebar-icon"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="admin-main-area">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="d-flex align-items-center gap-3">
            {/* Collapse toggle */}
            <button
              className="btn btn-sm btn-light border-0"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title="Toggle sidebar"
            >
              <i
                className={`bi ${sidebarCollapsed ? "bi-layout-sidebar" : "bi-layout-sidebar-reverse"}`}
              ></i>
            </button>
            {/* Divider */}
            <div className="vr opacity-25"></div>
            <span className="text-muted small fw-medium">Admin Panel</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Notifications */}
            <button
              className="btn btn-sm btn-light border position-relative"
              title="Notifications"
            >
              <i className="bi bi-bell"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.55rem", padding: "2px 4px" }}
              >
                3
              </span>
            </button>

            {/* Quick link to public site */}
            <Link
              to="/"
              className="btn btn-sm btn-light border"
              title="View public site"
            >
              <i className="bi bi-box-arrow-up-right me-1"></i>
              <span
                className="d-none d-md-inline"
                style={{ fontSize: "0.8rem" }}
              >
                View Site
              </span>
            </Link>

            {/* Admin avatar dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-sm d-flex align-items-center gap-2 border"
                data-bs-toggle="dropdown"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: BRAND,
                    fontSize: "0.75rem",
                  }}
                >
                  A
                </div>
                <span
                  className="d-none d-md-inline fw-semibold"
                  style={{ fontSize: "0.85rem" }}
                >
                  Admin
                </span>
                <i
                  className="bi bi-chevron-down"
                  style={{ fontSize: "0.65rem" }}
                ></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-1">
                <li>
                  <span className="dropdown-item-text small text-muted px-3 py-1">
                    Logged in as
                  </span>
                </li>
                <li>
                  <span
                    className="dropdown-item-text fw-semibold px-3 pb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Administrator
                  </span>
                </li>
                <li>
                  <hr className="dropdown-divider my-1" />
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 w-100 text-start border-0 bg-transparent">
                    <i className="bi bi-person"></i> My Profile
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 w-100 text-start border-0 bg-transparent">
                    <i className="bi bi-gear"></i> Settings
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider my-1" />
                </li>
                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    to="/login"
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content-scroll">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
