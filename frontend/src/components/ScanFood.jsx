import { FaCamera, FaBarcode } from "react-icons/fa";
import "../styles/scanfood.css";

function ScanFood() {
  return (
    <div className="scan-section">

      <h2>Scan Your Food</h2>

      <p>
        Upload a food image or scan a barcode to get instant nutrition
        information.
      </p>

      <div className="scan-container">

        <div className="upload-card">

          <div className="scan-icon">
            <FaCamera />
          </div>

          <h3>Upload Food Image</h3>

          <span>JPG, PNG up to 10MB</span>

          <button>Upload</button>

        </div>

        <div className="or">OR</div>

        <div className="barcode-card">

          <div className="scan-icon green">
            <FaBarcode />
          </div>

          <h3>Scan Barcode</h3>

          <span>Point your camera to barcode</span>

          <button className="green-btn">
            Start Scanning
          </button>

        </div>

        <div className="food-image">

          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
            alt="Food"
          />

          <p>
            AI will detect<br/>
            and calculate<br/>
            nutrition
          </p>

        </div>

      </div>

    </div>
  );
}

export default ScanFood;