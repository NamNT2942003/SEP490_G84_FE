import React, { useState } from "react";
import { NavLink } from "react-router-dom"; // Dùng NavLink để tự động highlight menu đang chọn
import { COLORS } from "@/constants";

const Sidebar = () => {
  // Thêm state để quản lý trạng thái đóng/mở của menu Inventory
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Danh sách menu dựa trên SRS (Đã thêm subItems cho Inventory)
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },

    // Đã đổi thành /admin/rooms thay vì /rooms (vì /rooms đang để Coming Soon)
    { path: "/admin/rooms", label: "Room Management", icon: "bi-door-open" },

    // Thêm mục Furniture Management có trong AppRouter
    { path: "/admin/furniture", label: "Furniture Management", icon: "bi-lamp" },

    // Đã đổi từ /staff thành /accounts cho khớp với Route
    { path: "/accounts", label: "Account Management", icon: "bi-people" },

    // --- CÁC TRANG CHƯA CÓ TRONG APPROUTER ---
    // (Bấm vào sẽ bị chuyển hướng về /login do dính catch-all Route "*")
    { path: "/bookings", label: "Booking Management", icon: "bi-calendar-check" },
    { path: "/services", label: "Services", icon: "bi-cup-hot" },
    { path: "/staff", label: "Staff Account", icon: "bi-people" },
    {
      path: "/inventory",
      label: "Inventory",
      icon: "bi-box",
      // Khai báo menu con ở đây
      subItems: [
        { path: "/inventory", label: "Inventory List", icon: "bi-box" }, // Nút vào trang gốc
        { path: "/inventoryHistory", label: "Import History", icon: "bi-box" },
        { path: "/inventoryReport", label: "Inventory Report", icon: "bi-box" }
      ]
    },
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

                {/* Nếu menu có chứa subItems (như Inventory) thì render theo kiểu Dropdown */}
                {item.subItems ? (
                    <>
                      {/* Nút cha bấm vào để xổ xuống */}
                      <div
                          className="nav-link text-white d-flex align-items-center justify-content-between"
                          style={{ cursor: "pointer" }}
                          onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                      >
                        <div>
                          <i className={`bi ${item.icon} me-3 fs-5`}></i>
                          {item.label}
                        </div>
                        {/* Icon mũi tên tự động lật lên xuống */}
                        <i className={`bi bi-chevron-${isInventoryOpen ? "up" : "down"} ms-auto`}></i>
                      </div>

                      {/* Danh sách menu con */}
                      {isInventoryOpen && (
                          <ul className="nav flex-column mt-1" style={{ paddingLeft: "2.5rem" }}>
                            {item.subItems.map((sub, subIndex) => (
                                <li className="nav-item mb-1" key={subIndex}>
                                  <NavLink
                                      to={sub.path}
                                      end={sub.path === "/inventory"} // Đảm bảo trang gốc không bị highlight đè
                                      className={({ isActive }) =>
                                          `nav-link text-white d-flex align-items-center ${isActive ? "active-menu" : ""}`
                                      }
                                      style={({ isActive }) => ({
                                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                                        fontWeight: isActive ? "bold" : "normal",
                                        fontSize: "0.9rem",
                                        padding: "0.4rem 1rem"
                                      })}
                                  >
                                    {sub.label}
                                  </NavLink>
                                </li>
                            ))}
                          </ul>
                      )}
                    </>
                ) : (
                    // Nếu là các menu bình thường không có Dropdown thì giữ nguyên code cũ
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
                        })}
                    >
                      <i className={`bi ${item.icon} me-3 fs-5`}></i>
                      {item.label}
                    </NavLink>
                )}

              </li>
          ))}
        </ul>

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