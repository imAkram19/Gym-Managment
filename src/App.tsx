import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import MemberDetail from './pages/MemberDetail';
import Attendance from './pages/Attendance';
import Leaderboard from './pages/Leaderboard';
import Biometrics from './pages/Biometrics';
import { Login } from './pages/Login';
import { notify } from './lib/toast';

// Wire notify factory navigate fn — must be inside Router
function AppRoutes() {
  const navigate = useNavigate();
  notify._setNavigate(navigate);

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<MembersList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="biometrics" element={<Biometrics />} />
      </Route>
    </Routes>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('irongym_logged_in') === 'true';
  });

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
