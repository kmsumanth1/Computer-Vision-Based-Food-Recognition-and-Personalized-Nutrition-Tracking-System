import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Loading from '../components/common/Loading';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ForgotPassword from '../pages/ForgotPassword';
import ProfileSetup from '../pages/ProfileSetup';
import CalorieCalculation from '../pages/CalorieCalculation';
import Dashboard from '../pages/Dashboard';
import Meals from '../pages/Meals';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import { PublicOnly, RequireAuth, RequireProfile } from './guards';

// Recharts is large, so the History page loads on demand.
const History = lazy(() => import('../pages/History'));
// ZXing (barcode decoding) is also heavy, so Food Analysis loads on demand.
const FoodAnalysis = lazy(() => import('../pages/FoodAnalysis'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/calculating" element={<CalorieCalculation />} />

        <Route element={<RequireProfile />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/food-analysis"
              element={
                <Suspense fallback={<Loading message="Loading…" />}>
                  <FoodAnalysis />
                </Suspense>
              }
            />
            <Route path="/meals" element={<Meals />} />
            <Route
              path="/history"
              element={
                <Suspense fallback={<Loading message="Loading history…" />}>
                  <History />
                </Suspense>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
