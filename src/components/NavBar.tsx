import { Download, Palette2 } from "react-bootstrap-icons";
import "./Paint.css";

interface NavBarProps {
  onClick: () => void;
}

const NavBar = ({ onClick }: NavBarProps) => {
  return (
    <div>
      <nav className="navbar">
        <div className="logo-section">
          <Palette2 className="logo-icon" size={24} />
          <span>CanvasPro</span>
        </div>

        <button className="nav-download-btn" onClick={onClick}>
          <Download size={18} />
          <span>Download</span>
        </button>
      </nav>
    </div>
  );
};

export default NavBar;
