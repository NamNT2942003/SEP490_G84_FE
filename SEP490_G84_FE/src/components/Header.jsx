import { Link } from "react-router-dom";
import Logo from "./Logo";

const Header = () => {
  return (
    <header className="py-3 shadow-sm" style={{ backgroundColor: "#5C6F4E" }}>
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
