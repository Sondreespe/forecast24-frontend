import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="header">
      <div className="logo">Forecast24</div>
      <nav className="nav">
        <Link to="/" className={pathname === "/" || pathname === "/home" ? "nav-pill" : ""}>Hjem</Link>
        <Link to="/dashboard" className={pathname === "/dashboard" ? "nav-pill" : ""}>Dashboard</Link>
        <Link to="/features">Features</Link>
      </nav>
    </header>
  );
}