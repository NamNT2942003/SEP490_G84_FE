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

  const isHousekeeper = currentUser?.permissions?.isHousekeeper;
  const isStaff = currentUser?.permissions?.isStaff;
  const isManager = currentUser?.permissions?.isManager;
  const isAdmin = currentUser?.permissions?.isAdmin;

  // --- Menu groups ---
  const menuGroups = [
    {
      groupLabel: "Operations",
      items: [
        { path: "/manager-booking", label: "Front Desk", icon: "bi-key", show: !isHousekeeper },
        { path: "/stay", label: "In-house (Stay)", icon: "bi-house-door", show: !isHousekeeper },
        { path: "/housekeeping", label: "Housekeeping", icon: "bi-stars", show: true },
        { path: "/bookings", label: "Bookings", icon: "bi-calendar-check", show: !isHousekeeper },
      ],
    },
    {
      groupLabel: "Management",
      items: [
        {
          path: "/admin/branches",
          label: "Branches",
          icon: "bi-building",
          show: isAdmin || isManager,
        },
        {
          path: "/admin/rooms",
          label: "Rooms",
          icon: "bi-door-open",
          show: isAdmin || isManager,
        },
        {
          path: "/admin/room-types",
          label: "Room Types",
          icon: "bi-grid-1x2",
          show: isAdmin || isManager,
        },
        {
          path: "/admin/room-inventories",
          label: "Room Inventories",
          icon: "bi-calendar3-range",
          show: isAdmin || isManager,
        },
        {
          path: "/furniture/furniture",
          label: "Furniture Master",
          icon: "bi-lamp",
          show: isAdmin || isManager,
        },
        {
          path: "/inventory",
          label: "Main Inventory",
          icon: "bi-box-seam",
          show: isAdmin || isManager,
        },
        {
          path: "/accounts",
          label: "Accounts",
          icon: "bi-people",
          show: currentUser?.permissions?.canAccessAccountList,
        },
        {
          path: "/services",
          label: "Services",
          icon: "bi-cup-hot",
          show: isAdmin || isManager,
        },
      ],
    },
    {
      groupLabel: "Reports",
      items: [
        { path: "/report/revenue", label: "Room Revenue", icon: "bi-building", show: isAdmin || isManager },
        { path: "/report/services", label: "Service Revenue", icon: "bi-cup-hot", show: isAdmin || isManager },
        { path: "/report/expense", label: "Operating Expenses", icon: "bi-receipt", show: isAdmin || isManager },
        { path: "/report/aggregated", label: "Aggregated Report", icon: "bi-clipboard-data", show: isAdmin || isManager },
        { path: "/report/multi-branch", label: "Multi-Branch Report", icon: "bi-diagram-3-fill", show: isAdmin || isManager },
      ],
    },
    {
      groupLabel: "Finance",
      items: [
        { path: "/finance/cashflow", label: "Cash Flow Report", icon: "bi-arrow-down-circle", show: isAdmin || isManager },
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
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.PRIMARY,
        display: "flex",
        flexDirection: "column",
        paddingTop: "8px",
        transition: "all 0.3s ease",
      }}
    >
      {/* Scrollable Menu Area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "8px" }}>
        {/* Logo / Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: collapsed ? "0 14px 12px" : "0 16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            marginBottom: "4px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <i className="bi bi-building-fill" style={{ fontSize: "1.25rem", color: "#fff", flexShrink: 0 }}></i>
          {!collapsed && (
            <span style={{ fontWeight: "800", fontSize: "1rem", color: "#fff", letterSpacing: "0.5px" }}>
              AN-IHBMS
            </span>
          )}
        </div>

        {/* Menu Groups */}
        <nav style={{ padding: collapsed ? "0 6px" : "0 10px" }}>
          {menuGroups.map((group, gi) => {
            const visibleItems = group.items.filter((item) => item.show !== false);
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} style={{ marginBottom: "4px" }}>
                {/* Group label */}
                {!collapsed && (
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: "700",
                      letterSpacing: "0.9px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      padding: "6px 10px 2px",
                    }}
                  >
                    {group.groupLabel}
                  </div>
                )}
                {collapsed && gi > 0 && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 4px" }} />
                )}

                <ul className="nav flex-column" style={{ gap: "1px" }}>
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
                              padding: collapsed ? "8px 0" : "7px 10px",
                              borderRadius: "6px",
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
                                style={{ fontSize: "1rem", flexShrink: 0, color: "#fff" }}
                              ></i>
                              {!collapsed && <span style={{ fontSize: "0.85rem" }}>{item.label}</span>}
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
                              <ul className="nav flex-column" style={{ paddingLeft: "10px", gap: "1px", marginTop: "2px" }}>
                                {item.children.map((child, ci) => (
                                  <li key={ci}>
                                    <NavLink
                                      to={child.path}
                                      className="nav-link d-flex align-items-center gap-2"
                                      style={navLinkStyle}
                                    >
                                      <i
                                        className={`bi ${child.icon || "bi-dot"}`}
                                        style={{ fontSize: "0.8rem", flexShrink: 0 }}
                                      ></i>
                                      <span style={{ fontSize: "0.82rem" }}>{child.label}</span>
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
                            padding: collapsed ? "8px 0" : "7px 10px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          })}
                          title={collapsed ? item.label : ""}
                        >
                          <i
                            className={`bi ${item.icon}`}
                            style={{ fontSize: "1rem", flexShrink: 0 }}
                          ></i>
                          {!collapsed && <span style={{ fontSize: "0.85rem" }}>{item.label}</span>}
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
    </div>
  );
};

export default Sidebar;