import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import MemberDetail from './pages/MemberDetail';
import Attendance from './pages/Attendance';
import Leaderboard from './pages/Leaderboard';
import Biometrics from './pages/Biometrics';
import { Login } from './pages/Login';
import { ClientPortal } from './pages/client/ClientPortal';
import { notify } from './lib/toast';

interface ProtectedStaffRouteProps {
  isLoggedIn: boolean;
  children: React.ReactNode;
}

function ProtectedStaffRoute({ isLoggedIn, children }: ProtectedStaffRouteProps) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes({
  isLoggedIn,
  setIsLoggedIn,
}: {
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
}) {
  const navigate = useNavigate();
  notify._setNavigate(navigate);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  return (
    <Routes>
      {/* ── Public Client-Facing Portal ─────────────────────────── */}
      <Route path="/" element={<ClientPortal />} />
      <Route path="/rank" element={<ClientPortal />} />

      {/* ── Receptionist & Staff Login Gate ────────────────────── */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/portal" element={<Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* ── Protected Receptionist & Gym Management Operations ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedStaffRoute isLoggedIn={isLoggedIn}>
            <AppShell />
          </ProtectedStaffRoute>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedStaffRoute isLoggedIn={isLoggedIn}>
            <AppShell />
          </ProtectedStaffRoute>
        }
      >
        <Route path="members" element={<MembersList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="biometrics" element={<Biometrics />} />
        <Route path="vault" element={<Biometrics />} />
      </Route>

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('irongym_logged_in') === 'true';
  });

  return (
    <Router>
      <AppRoutes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </Router>
  );
}

export default App;
