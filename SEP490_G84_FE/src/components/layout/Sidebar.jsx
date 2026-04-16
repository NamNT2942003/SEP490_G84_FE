import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser.js";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";

// ─── Brand colours ─────────────────────────────────────────────────────────
const BG        = "#1b2a1c";          // very-dark forest
const BG_CARD   = "rgba(255,255,255,0.05)";
const ACCENT    = "#6fcf72";          // vivid sage-green highlight
const ACCENT_BG = "rgba(111,207,114,0.15)";
const DIVIDER   = "rgba(255,255,255,0.08)";
const TEXT_DIM  = "rgba(255,255,255,0.38)";
const TEXT_MID  = "rgba(255,255,255,0.72)";
const TEXT_FULL = "#ffffff";

const Sidebar = ({ collapsed }) => {
  const currentUser = useCurrentUser();
  const location    = useLocation();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const [openMenus, setOpenMenus] = useState({});

  const toggleDropdown = (label) => {
    if (collapsed) return;
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isHousekeeper = currentUser?.permissions?.isHousekeeper;
  const isStaff       = currentUser?.permissions?.isStaff;
  const isManager     = currentUser?.permissions?.isManager;
  const isAdmin       = currentUser?.permissions?.isAdmin;

  // ─── Menu definition ────────────────────────────────────────────────────
  const menuGroups = [
    {
      groupLabel: "Operations",
      groupIcon:  "bi-lightning-charge-fill",
      items: [
        { path: "/manager-booking", label: "Front Desk",      icon: "bi-key-fill",         show: !isHousekeeper },
        { path: "/stay",            label: "In-house",         icon: "bi-house-door-fill",   show: !isHousekeeper },
        { path: "/housekeeping",    label: "Housekeeping",     icon: "bi-stars",             show: true },
        { path: "/bookings",        label: "Bookings",         icon: "bi-calendar-check-fill", show: !isHousekeeper },
        { path: "/services",        label: "Services",         icon: "bi-cup-hot-fill",      show: !isStaff && !isHousekeeper },
      ],
    },
    {
      groupLabel: "Management",
      groupIcon:  "bi-gear-fill",
      items: [
        { path: "/admin/branches",        label: "Branches",         icon: "bi-building-fill",   show: isAdmin || isManager },
        { path: "/admin/rooms",           label: "Rooms",            icon: "bi-door-open-fill",   show: isAdmin || isManager },
        { path: "/admin/room-types",      label: "Room Types",       icon: "bi-grid-1x2-fill",   show: isAdmin || isManager },
        { path: "/admin/room-inventories",label: "Room Inventories", icon: "bi-calendar3-range",  show: isAdmin || isManager },
        { path: "/furniture/furniture",   label: "Furniture",        icon: "bi-lamp-fill",        show: isAdmin || isManager },
        { path: "/inventory",             label: "Inventory",        icon: "bi-box-seam-fill",    show: isAdmin || isManager },
        { path: "/accounts",              label: "Accounts",         icon: "bi-people-fill",      show: currentUser?.permissions?.canAccessAccountList },
      ],
    },
    {
      groupLabel: "Analytics",
      groupIcon:  "bi-bar-chart-fill",
      items: [
        {
          label: "Reports",
          icon:  "bi-bar-chart-line-fill",
          show:  isAdmin || isManager,
          children: [
            { path: "/report/multi-branch", label: "Multi-Branch",        icon: "bi-diagram-3-fill" },
            { path: "/report/revenue",      label: "Room Revenue",         icon: "bi-building" },
            { path: "/report/services",     label: "Service Revenue",      icon: "bi-cup-hot" },
            { path: "/report/expense",      label: "Operating Expenses",   icon: "bi-receipt" },
            { path: "/report/aggregated",   label: "Aggregated Report",    icon: "bi-clipboard-data" },
          ],
        },
        {
          label: "Finance",
          icon:  "bi-cash-coin",
          show:  isAdmin || isManager,
          children: [
            { path: "/finance/cashflow", label: "Cash Flow", icon: "bi-arrow-down-circle" },
          ],
        },
      ],
    },
  ];

  // Auto-open accordion on page load
  useEffect(() => {
    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((c) =>
            location.pathname.startsWith(c.path)
          );
          if (isChildActive) {
            setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ─── User initials ───────────────────────────────────────────────────────
  const initials = (currentUser?.fullName || currentUser?.username || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const roleLabel = isAdmin ? "Admin" : isManager ? "Manager" : isHousekeeper ? "Housekeeper" : "Staff";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // ─── Shared item style helpers ───────────────────────────────────────────
  const itemBase = {
    display:      "flex",
    alignItems:   "center",
    gap:          collapsed ? 0 : "10px",
    justifyContent: collapsed ? "center" : "flex-start",
    padding:      collapsed ? "9px 0" : "8px 12px",
    borderRadius: "10px",
    cursor:       "pointer",
    transition:   "all 0.18s ease",
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textDecoration: "none",
    color:        TEXT_MID,
    fontWeight:   "400",
    fontSize:     "0.84rem",
  };

  const itemActive = {
    backgroundColor: ACCENT_BG,
    color:           ACCENT,
    fontWeight:      "600",
  };

  const itemHover = {
    backgroundColor: "rgba(255,255,255,0.07)",
    color:           TEXT_FULL,
  };

  const NavItem = ({ item }) => {
    const [hovered, setHovered] = useState(false);
    const isActive = location.pathname.startsWith(item.path);
    const style = {
      ...itemBase,
      ...(isActive ? itemActive : hovered ? itemHover : {}),
    };
    return (
      <NavLink
        to={item.path}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={collapsed ? item.label : ""}
      >
        <i
          className={`bi ${item.icon}`}
          style={{
            fontSize:   "1rem",
            flexShrink: 0,
            color:      isActive ? ACCENT : hovered ? TEXT_FULL : TEXT_MID,
            transition: "color 0.18s ease",
          }}
        />
        {!collapsed && <span>{item.label}</span>}
        {isActive && !collapsed && (
          <span
            style={{
              marginLeft:      "auto",
              width:           "6px",
              height:          "6px",
              borderRadius:    "50%",
              backgroundColor: ACCENT,
              flexShrink:      0,
            }}
          />
        )}
      </NavLink>
    );
  };

  const AccordionItem = ({ item }) => {
    const [hovered, setHovered] = useState(false);
    const isOpen = openMenus[item.label] && !collapsed;
    const isAnyChildActive = item.children?.some((c) =>
      location.pathname.startsWith(c.path)
    );

    return (
      <li style={{ listStyle: "none" }}>
        {/* Parent trigger */}
        <div
          onClick={() => toggleDropdown(item.label)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...itemBase,
            ...(isAnyChildActive ? itemActive : hovered ? itemHover : {}),
          }}
        >
          <i
            className={`bi ${item.icon}`}
            style={{
              fontSize:   "1rem",
              flexShrink: 0,
              color:      isAnyChildActive ? ACCENT : hovered ? TEXT_FULL : TEXT_MID,
              transition: "color 0.18s ease",
            }}
          />
          {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
          {!collapsed && (
            <i
              className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
              style={{
                fontSize:   "0.7rem",
                color:      TEXT_DIM,
                transition: "transform 0.2s ease",
                transform:  isOpen ? "rotate(0deg)" : "rotate(0deg)",
              }}
            />
          )}
        </div>

        {/* Children */}
        {!collapsed && (
          <div
            style={{
              maxHeight:  isOpen ? "400px" : "0",
              overflow:   "hidden",
              transition: "max-height 0.28s ease",
            }}
          >
            <ul
              style={{
                padding:   "2px 0 2px 14px",
                margin:    0,
                listStyle: "none",
                display:   "flex",
                flexDirection: "column",
                gap:       "1px",
              }}
            >
              {item.children.map((child, ci) => {
                const childActive = location.pathname.startsWith(child.path);
                return (
                  <li key={ci}>
                    <NavLink
                      to={child.path}
                      style={{
                        display:        "flex",
                        alignItems:     "center",
                        gap:            "8px",
                        padding:        "6px 10px 6px 10px",
                        borderRadius:   "8px",
                        fontSize:       "0.8rem",
                        fontWeight:     childActive ? "600" : "400",
                        color:          childActive ? ACCENT : TEXT_MID,
                        backgroundColor: childActive ? ACCENT_BG : "transparent",
                        textDecoration: "none",
                        transition:     "all 0.15s ease",
                        borderLeft:     childActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                      }}
                    >
                      <i
                        className={`bi ${child.icon || "bi-dot"}`}
                        style={{ fontSize: "0.78rem", flexShrink: 0 }}
                      />
                      <span>{child.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <div
      style={{
        width:           "100%",
        height:          "100%",
        backgroundColor: BG,
        display:         "flex",
        flexDirection:   "column",
        transition:      "all 0.3s ease",
        borderRight:     `1px solid ${DIVIDER}`,
      }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           "10px",
          padding:       collapsed ? "18px 0 16px" : "18px 20px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom:  `1px solid ${DIVIDER}`,
          flexShrink:    0,
        }}
      >
        <div
          style={{
            width:           "32px",
            height:          "32px",
            borderRadius:    "8px",
            background:      `linear-gradient(135deg, ${ACCENT} 0%, #3a8c3d 100%)`,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            flexShrink:      0,
            boxShadow:       `0 4px 14px rgba(111,207,114,0.35)`,
          }}
        >
          <i className="bi bi-building-fill" style={{ fontSize: "0.9rem", color: "#fff" }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: "800", fontSize: "0.95rem", color: TEXT_FULL, letterSpacing: "0.3px", lineHeight: 1.2 }}>
              AN-IHBMS
            </div>
            <div style={{ fontSize: "0.62rem", color: TEXT_DIM, letterSpacing: "0.5px" }}>
              Hotel Management
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable nav ───────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "10px 8px" : "10px 12px" }}>
        {menuGroups.map((group, gi) => {
          const visibleItems = group.items.filter((item) => item.show !== false);
          if (visibleItems.length === 0) return null;
          return (
            <div key={gi} style={{ marginBottom: "6px" }}>
              {/* Section header */}
              {!collapsed && (
                <div
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           "6px",
                    fontSize:      "0.6rem",
                    fontWeight:    "700",
                    letterSpacing: "1.1px",
                    textTransform: "uppercase",
                    color:         TEXT_DIM,
                    padding:       "10px 12px 4px",
                  }}
                >
                  <i className={`bi ${group.groupIcon}`} style={{ fontSize: "0.6rem" }} />
                  {group.groupLabel}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: "1px", background: DIVIDER, margin: "6px 4px" }} />
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                {visibleItems.map((item, idx) =>
                  item.children
                    ? <AccordionItem key={idx} item={item} />
                    : <li key={idx}><NavItem item={item} /></li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── User card (bottom) ───────────────────────── */}
      <div
        style={{
          borderTop:   `1px solid ${DIVIDER}`,
          padding:     collapsed ? "12px 8px" : "12px 14px",
          flexShrink:  0,
        }}
      >
        {/* Profile row */}
        <div
          onClick={() => navigate("/profile")}
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "10px",
            padding:         collapsed ? "8px 0" : "8px 10px",
            borderRadius:    "10px",
            cursor:          "pointer",
            backgroundColor: BG_CARD,
            justifyContent:  collapsed ? "center" : "flex-start",
            marginBottom:    "4px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width:           "32px",
              height:          "32px",
              borderRadius:    "50%",
              background:      `linear-gradient(135deg, ${ACCENT}, #3a8c3d)`,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        "0.75rem",
              fontWeight:      "700",
              color:           "#fff",
              flexShrink:      0,
            }}
          >
            {initials || "?"}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "600", color: TEXT_FULL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUser?.fullName || "Unknown"}
              </div>
              <div style={{ fontSize: "0.68rem", color: TEXT_DIM }}>
                {roleLabel}{currentUser?.branchName ? ` · ${currentUser.branchName}` : ""}
              </div>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            width:           "100%",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  collapsed ? "center" : "flex-start",
            gap:             "8px",
            padding:         collapsed ? "7px 0" : "7px 10px",
            borderRadius:    "8px",
            border:          "none",
            background:      "transparent",
            color:           "rgba(255,100,100,0.75)",
            fontSize:        "0.8rem",
            cursor:          "pointer",
            transition:      "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,80,80,0.1)";
            e.currentTarget.style.color = "rgba(255,100,100,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "rgba(255,100,100,0.75)";
          }}
        >
          <i className="bi bi-box-arrow-right" style={{ fontSize: "0.95rem" }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;