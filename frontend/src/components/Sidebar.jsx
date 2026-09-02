import {
  FaHome,
  FaCamera,
  FaUtensils,
  FaHistory,
  FaChartPie,
  FaBullseye,
  FaChartBar,
  FaTint,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaAppleAlt,
} from "react-icons/fa";

import "../styles/sidebar.css";

function Sidebar() {
  const menuItems = [
    { icon: <FaHome />, text: "Dashboard", active: true },
    { icon: <FaCamera />, text: "Scan Food" },
    { icon: <FaUtensils />, text: "Meals" },
    { icon: <FaHistory />, text: "History" },
    { icon: <FaChartPie />, text: "Nutrition" },
    { icon: <FaBullseye />, text: "Goals" },
    { icon: <FaChartBar />, text: "Reports" },
    { icon: <FaTint />, text: "Water Tracker" },
    { icon: <FaUser />, text: "Profile" },
    { icon: <FaCog />, text: "Settings" },
  ];

  return (
    <aside className="sidebar">

      <div>

        <div className="logo">

          <div className="logoIcon">
            <FaAppleAlt />
          </div>

          <div>
            <h2>AI Food</h2>
            <p>Calories Meter</p>
          </div>

        </div>

        <ul className="menu">

          {menuItems.map((item, index) => (
            <li key={index} className={item.active ? "active" : ""}>
              {item.icon}
              <span>{item.text}</span>
            </li>
          ))}

        </ul>

      </div>

      <div>

        <div className="premium">

          <h3>👑 Go Premium</h3>

          <p>
            Unlock advanced insights,
            custom plans and more.
          </p>

          <button>Upgrade Now</button>

        </div>

        <button className="logout">

          <FaSignOutAlt />

          Logout

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;