import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { COLORS } from "@/constants";

const Sidebar = () => {
    // Thêm state để quản lý trạng thái đóng/mở của menu Inventory
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    // Danh sách menu dựa trên SRS (Đã thêm subItems cho Inventory và sửa path)
    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
        { path: "/admin/rooms", label: "Room Management", icon: "bi-door-open" },
        { path: "/admin/furniture", label: "Furniture Management", icon: "bi-lamp" },
        { path: "/accounts", label: "Account Management", icon: "bi-people" },
        { path: "/bookings", label: "Booking Management", icon: "bi-calendar-check" },
        { path: "/services", label: "Services", icon: "bi-cup-hot" },
        { path: "/staff", label: "Staff Account", icon: "bi-people" },
        {
            path: "/furniture",
            label: "Item Inventory",
            icon: "bi-box",
            // Khai báo menu con ở đây (Đã sửa đường dẫn cho khớp AppRouter)
            subItems: [
                { path: "/furniture/furniture", label: "Furniture Inventory" },
                { path: "/furniture/history", label: "Import History" },
                { path: "/furniture/report", label: "Inventory Report" }
            ]
        },
        { path: "/reports", label: "Reports", icon: "bi-bar-chart-line" },
    ];

    return (
        <div
            className="d-flex flex-column flex-shrink-0 p-3 text-white"
            style={{ width: "100%", height: "100%", minHeight: "100vh", backgroundColor: COLORS.PRIMARY }}
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
                                    style={{ cursor: "pointer", transition: "background-color 0.2s ease" }}
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
                                                    end={sub.path === "/furniture"} // Đảm bảo trang gốc không bị highlight đè
                                                    className={({ isActive }) =>
                                                        `nav-link text-white d-flex align-items-center ${isActive ? "active-menu" : ""}`
                                                    }
                                                    style={({ isActive }) => ({
                                                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                                                        fontWeight: isActive ? "bold" : "normal",
                                                        fontSize: "0.9rem",
                                                        padding: "0.4rem 1rem",
                                                        transition: "background-color 0.2s ease"
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
                                    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                                    fontWeight: isActive ? "bold" : "normal",
                                    transition: "background-color 0.2s ease" // Thêm chút hiệu ứng mượt mà khi hover/click
                                })}
                            >
                                <i className={`bi ${item.icon} me-3 fs-5`}></i>
                                {item.label}
                            </NavLink>
                        )}
                    </li>
                ))}
            </ul>
            <hr />
        </div>
    );
};

export default Sidebar;


