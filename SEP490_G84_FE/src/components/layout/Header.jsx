import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "./Logo";

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
        backgroundColor: scrolled ? "#5C6F4E" : "transparent",
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
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item">
                <Link
                  className="nav-link px-3"
                  to="/"
                  style={{
                    fontWeight: location.pathname === "/" ? "700" : "500",
                    letterSpacing: "0.5px",
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
                    letterSpacing: "0.5px",
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
                    letterSpacing: "0.5px",
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
                    fontWeight:
                      location.pathname === "/contact" ? "700" : "500",
                    letterSpacing: "0.5px",
                  }}
                >
                  Contact
                </Link>
              </li>
              <li className="nav-item ms-2">
                <Link
                  className="btn btn-sm px-4 py-2"
                  to="/search"
                  style={{
                    backgroundColor: "#C9A96E",
                    color: "#1E2A1E",
                    fontWeight: 700,
                    border: "none",
                    letterSpacing: "0.5px",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Book Now
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
