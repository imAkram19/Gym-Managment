import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import MemberDetail from './pages/MemberDetail';
import Attendance from './pages/Attendance';
import Subscriptions from './pages/Subscriptions';
import Biometrics from './pages/Biometrics';
import { Login } from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('irongym_logged_in') === 'true';
  });

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<MembersList />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="biometrics" element={<Biometrics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
