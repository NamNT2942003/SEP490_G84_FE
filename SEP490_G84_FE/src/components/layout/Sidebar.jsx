import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "@/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser.js";

const Sidebar = ({ collapsed }) => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});

  const toggleDropdown = (label) => {
    if (collapsed) return;
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // --- Menu groups ---
  const menuGroups = [
    {
      groupLabel: "Overview",
      items: [
        { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2", show: true },
      ],
    },
    {
      groupLabel: "Operations",
      items: [
        { path: "/manager-booking", label: "Check-in", icon: "bi-key", show: true },
        { path: "/stay", label: "In-house (Stay)", icon: "bi-house-door", show: true },
        { path: "/bookings", label: "Bookings", icon: "bi-calendar-check", show: true },
        // Cập nhật: Ẩn Services đối với role Staff (tích hợp logic từ code dưới)
        { path: "/services", label: "Services", icon: "bi-cup-hot", show: !currentUser?.permissions?.isStaff },
      ],
    },
    {
      groupLabel: "Management",
      items: [
        {
          path: "/admin/rooms",
          label: "Rooms",
          icon: "bi-door-open",
          show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager,
        },
        {
          path: "/admin/furniture",
          label: "Furniture",
          icon: "bi-lamp",
          show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager,
        },
        {
          path: "/inventory",
          label: "Inventory",
          icon: "bi-box-seam",
          show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager,
        },
        {
          path: "/accounts",
          label: "Accounts",
          icon: "bi-people",
          show: currentUser?.permissions?.canAccessAccountList || !currentUser?.permissions?.isStaff,
        },
      ],
    },
    {
      groupLabel: "Analytics",
      items: [
        {
          label: "Reports",
          icon: "bi-bar-chart-line",
          show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager,
          children: [
            { path: "/report/revenue", label: "Room Revenue", icon: "bi-building" },
            { path: "/report/services", label: "Service Revenue", icon: "bi-cup-hot" },
            { path: "/report/expense", label: "Operating Expenses", icon: "bi-receipt" },
            { path: "/report/aggregated", label: "Aggregated Report", icon: "bi-clipboard-data" },
            { path: "/report/multi-branch", label: "Multi-Branch Report", icon: "bi-diagram-3-fill" },
          ],
        },
        {
          label: "Dòng tiền",
          icon: "bi-cash-coin",
          show: currentUser?.permissions?.isAdmin || currentUser?.permissions?.isManager,
          children: [
            { path: "/finance/cashflow", label: "Báo cáo thu tiền", icon: "bi-arrow-down-circle" },
          ],
        },
      ],
    },
  ];

  // Auto-open accordion if child is active
  useEffect(() => {
    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            location.pathname.startsWith(child.path)
          );
          if (isChildActive) {
            setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navLinkStyle = ({ isActive }) => ({
    backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "transparent",
    fontWeight: isActive ? "700" : "400",
    transition: "all 0.18s ease",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.92)",
  });

  // --- Logic xử lý Profile mang từ file dưới lên ---
  const initials =
    (currentUser?.fullName || currentUser?.username || "AN")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

  const handleViewProfile = () => navigate("/profile");
  const handleEditProfile = (e) => {
    e.stopPropagation(); // Tránh bị trigger sự kiện click của thẻ cha
    navigate("/profile");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.PRIMARY,
        display: "flex",
        flexDirection: "column",
        paddingTop: "12px",
        transition: "all 0.3s ease",
      }}
    >
      {/* Scrollable Area cho Menu */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "16px" }}>
        {/* Logo / Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: collapsed ? "0 14px 16px" : "0 20px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            marginBottom: "8px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <i className="bi bi-building-fill" style={{ fontSize: "1.5rem", color: "#fff", flexShrink: 0 }}></i>
          {!collapsed && (
            <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#fff", letterSpacing: "0.5px" }}>
              AN-IHBMS
            </span>
          )}
        </div>

        {/* Menu Groups */}
        <nav style={{ padding: collapsed ? "0 8px" : "0 12px" }}>
          {menuGroups.map((group, gi) => {
            const visibleItems = group.items.filter((item) => item.show !== false);
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} style={{ marginBottom: "8px" }}>
                {/* Group label */}
                {!collapsed && (
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: "700",
                      letterSpacing: "0.9px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.45)",
                      padding: "10px 10px 4px",
                    }}
                  >
                    {group.groupLabel}
                  </div>
                )}
                {collapsed && gi > 0 && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.12)", margin: "8px 4px" }} />
                )}

                <ul className="nav flex-column" style={{ gap: "2px" }}>
                  {visibleItems.map((item, idx) => {
                    if (item.children) {
                      const isOpen = openMenus[item.label] && !collapsed;
                      const isAnyChildActive = item.children.some((c) =>
                        location.pathname.startsWith(c.path)
                      );
                      return (
                        <li className="nav-item" key={idx}>
                          <div
                            onClick={() => toggleDropdown(item.label)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: collapsed ? "center" : "space-between",
                              padding: collapsed ? "10px 0" : "9px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor: isAnyChildActive
                                ? "rgba(255,255,255,0.18)"
                                : "transparent",
                              color: "rgba(255,255,255,0.92)",
                              fontWeight: isAnyChildActive ? "700" : "400",
                              transition: "all 0.18s ease",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <i
                                className={`bi ${item.icon}`}
                                style={{ fontSize: "1.1rem", flexShrink: 0, color: "#fff" }}
                              ></i>
                              {!collapsed && <span style={{ fontSize: "0.92rem" }}>{item.label}</span>}
                            </div>
                            {!collapsed && (
                              <i
                                className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
                                style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}
                              ></i>
                            )}
                          </div>

                          {/* Dropdown children */}
                          {!collapsed && (
                            <div
                              style={{
                                maxHeight: isOpen ? "300px" : "0",
                                overflow: "hidden",
                                transition: "max-height 0.3s ease",
                              }}
                            >
                              <ul className="nav flex-column" style={{ paddingLeft: "12px", gap: "2px", marginTop: "4px" }}>
                                {item.children.map((child, ci) => (
                                  <li key={ci}>
                                    <NavLink
                                      to={child.path}
                                      className="nav-link d-flex align-items-center gap-2"
                                      style={navLinkStyle}
                                    >
                                      <i
                                        className={`bi ${child.icon || "bi-dot"}`}
                                        style={{ fontSize: "0.85rem", flexShrink: 0 }}
                                      ></i>
                                      <span style={{ fontSize: "0.88rem" }}>{child.label}</span>
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    }

                    // Normal single item
                    return (
                      <li className="nav-item" key={idx}>
                        <NavLink
                          to={item.path}
                          className="nav-link d-flex align-items-center gap-2"
                          style={({ isActive }) => ({
                            ...navLinkStyle({ isActive }),
                            justifyContent: collapsed ? "center" : "flex-start",
                            padding: collapsed ? "10px 0" : "9px 12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          })}
                          title={collapsed ? item.label : ""}
                        >
                          <i
                            className={`bi ${item.icon}`}
                            style={{ fontSize: "1.1rem", flexShrink: 0 }}
                          ></i>
                          {!collapsed && <span style={{ fontSize: "0.92rem" }}>{item.label}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* TÍCH HỢP: User info & Profile Actions ở đáy Sidebar */}
      {currentUser && (
        <div
          style={{
            padding: collapsed ? "16px 0" : "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "10px",
            backgroundColor: "rgba(0,0,0,0.1)", // Highlighting the bottom section slightly
          }}
        >
          <div
            onClick={handleViewProfile}
            title="View Profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              flex: collapsed ? "none" : 1,
              overflow: "hidden",
            }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 34,
                height: 34,
                backgroundColor: "rgba(255,255,255,0.2)",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <strong
                  style={{
                    fontSize: 13,
                    lineHeight: 1.2,
                    margin: 0,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {currentUser?.fullName || currentUser?.username || "User"}
                </strong>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  {currentUser?.role || (currentUser?.permissions?.isAdmin ? "Admin" : currentUser?.permissions?.isManager ? "Manager" : "Staff")}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={handleEditProfile}
              title="Profile"
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <i className="bi bi-pencil-square" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;