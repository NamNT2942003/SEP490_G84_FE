import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import { COLORS } from "../../constants";

const Header = () => {
    const location = useLocation();
    const isHome = location.pathname === "/";
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!isHome) {
            setScrolled(true);
            return;
        }
        const handleScroll = () => setScrolled(window.scrollY > 80);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isHome]);

    return (
        <header
            className="py-3 shadow-sm"
            style={{
                backgroundColor: scrolled ? COLORS.PRIMARY : "transparent",
                position: isHome ? "fixed" : "relative",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1030,
                transition: "background-color 0.4s ease, box-shadow 0.4s ease",
                boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.15)" : "none",
            }}
        >
            <div className="container">
                <nav className="navbar navbar-expand-lg navbar-dark p-0">
                    <Link className="navbar-brand" to="/">
                        <Logo variant="light" size="md" />
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto align-items-center gap-2">
                            <li className="nav-item">
                                <Link
                                    className="nav-link px-3"
                                    to="/"
                                    style={{
                                        fontWeight: location.pathname === "/" ? "700" : "500",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                        fontSize: "0.8rem",
                                        color: location.pathname === "/" ? COLORS.TEXT_LIGHT : "rgba(255,255,255,0.7)"
                                    }}
                                >
                                    Home
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link px-3"
                                    to="/search"
                                    style={{
                                        fontWeight: location.pathname === "/search" ? "700" : "500",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                        fontSize: "0.8rem",
                                        color: location.pathname === "/search" ? COLORS.TEXT_LIGHT : "rgba(255,255,255,0.7)"
                                    }}
                                >
                                    Find Rooms
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link px-3"
                                    to="/about"
                                    style={{
                                        fontWeight: location.pathname === "/about" ? "700" : "500",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                        fontSize: "0.8rem",
                                        color: location.pathname === "/about" ? COLORS.TEXT_LIGHT : "rgba(255,255,255,0.7)"
                                    }}
                                >
                                    About Us
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link px-3"
                                    to="/contact"
                                    style={{
                                        fontWeight: location.pathname === "/contact" ? "700" : "500",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                        fontSize: "0.8rem",
                                        color: location.pathname === "/contact" ? COLORS.TEXT_LIGHT : "rgba(255,255,255,0.7)"
                                    }}
                                >
                                    Contact
                                </Link>
                            </li>

                            {/* Divider for visual separation */}
                            <div className="d-none d-lg-block mx-2" style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.15)' }}></div>

                            {/* My Bookings Button */}
                            <li className="nav-item">
                                <Link
                                    className="btn btn-sm px-3 py-2 d-flex align-items-center gap-2"
                                    to="/guest-access"
                                    style={{
                                        backgroundColor: "transparent",
                                        color: COLORS.TEXT_LIGHT,
                                        fontWeight: 600,
                                        border: "1px solid rgba(255,255,255,0.3)",
                                        letterSpacing: "0.5px",
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        borderRadius: "4px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    My Bookings
                                </Link>
                            </li>

                            {/* Book Now Button */}
                            <li className="nav-item">
                                <Link
                                    className="btn btn-sm px-3 py-2"
                                    to="/search"
                                    style={{
                                        backgroundColor: COLORS.SECONDARY,
                                        color: COLORS.PRIMARY,
                                        fontWeight: 700,
                                        border: `1px solid ${COLORS.SECONDARY}`,
                                        letterSpacing: "0.5px",
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        borderRadius: "4px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = COLORS.TEXT_LIGHT; e.currentTarget.style.borderColor = COLORS.TEXT_LIGHT; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = COLORS.SECONDARY; e.currentTarget.style.borderColor = COLORS.SECONDARY; }}
                                >
                                    Book Now
                                </Link>
                            </li>

                            {/* Login Button */}
                            <li className="nav-item">
                                <Link
                                    className="btn btn-sm px-4 py-2"
                                    to="/login"
                                    style={{
                                        backgroundColor: "transparent",
                                        color: COLORS.TEXT_LIGHT,
                                        fontWeight: 600,
                                        border: "1px solid rgba(255,255,255,0.3)",
                                        letterSpacing: "0.5px",
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        borderRadius: "4px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                                >
                                    Login
                                </Link>
                            </li>

                        </ul>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
