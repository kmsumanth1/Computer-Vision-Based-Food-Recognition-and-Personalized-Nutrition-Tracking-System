import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanFood from "./pages/ScanFood";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Main Application */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Invalid URL */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/scan"
          element={<ScanFood />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;