import {
  FaBars,
  FaBell,
  FaChevronDown
} from "react-icons/fa";

import "../styles/navbar.css";

function Navbar() {
  return (
    <header className="navbar">

      <div className="navLeft">
        <button className="menuBtn">
          <FaBars />
        </button>
      </div>

      <div className="navRight">

        <div className="notification">

          <FaBell />

          <span className="badge">3</span>

        </div>

        <div className="profile">

          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="profile"
          />

          <span>Sumanth</span>

          <FaChevronDown className="arrow"/>

        </div>

      </div>

    </header>
  );
}

export default Navbar;