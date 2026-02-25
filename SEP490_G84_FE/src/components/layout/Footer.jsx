import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      className="mt-5"
      style={{ backgroundColor: "#465c47", color: "#fff" }}
    >
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <h5 className="mb-3" style={{ color: "#7A8F6C" }}>
              AN NGUYEN Hotel & Serviced Apartment
            </h5>
            <p className="mb-3">
              Experience luxury and comfort in the heart of Vietnam. Our premium
              accommodations offer world-class service and modern amenities.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white">
                <i
                  className="bi bi-facebook"
                  style={{ fontSize: "1.5rem" }}
                ></i>
              </a>
              <a href="#" className="text-white">
                <i
                  className="bi bi-instagram"
                  style={{ fontSize: "1.5rem" }}
                ></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-twitter" style={{ fontSize: "1.5rem" }}></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-youtube" style={{ fontSize: "1.5rem" }}></i>
              </a>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="mb-3" style={{ color: "#7A8F6C" }}>
              Quick Links
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-white text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/search" className="text-white text-decoration-none">
                  Search Rooms
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/bookings"
                  className="text-white text-decoration-none"
                >
                  My Bookings
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-white text-decoration-none">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="mb-3" style={{ color: "#7A8F6C" }}>
              Services
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <span className="text-white">Room Service</span>
              </li>
              <li className="mb-2">
                <span className="text-white">Airport Transfer</span>
              </li>
              <li className="mb-2">
                <span className="text-white">Laundry Service</span>
              </li>
              <li className="mb-2">
                <span className="text-white">Conference Rooms</span>
              </li>
              <li className="mb-2">
                <span className="text-white">Spa & Wellness</span>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 mb-4">
            <h6 className="mb-3" style={{ color: "#7A8F6C" }}>
              Contact Info
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                <span>123 Hoan Kiem District, Hanoi</span>
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                <span>+84 24-3826-1234</span>
              </li>
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                <span>info@annguyen-hotel.com</span>
              </li>
              <li className="mb-2">
                <i className="bi bi-clock me-2"></i>
                <span>24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        className="border-top py-3"
        style={{ borderColor: "#4A5A3E !important" }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0 small text-white">
                © 2026 AN NGUYEN Hotel & Serviced Apartment. All rights
                reserved.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex justify-content-md-end gap-3">
                <Link
                  to="/privacy"
                  className="text-white text-decoration-none small"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-white text-decoration-none small"
                >
                  Terms & Conditions
                </Link>
                <Link
                  to="/cookies"
                  className="text-white text-decoration-none small"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
