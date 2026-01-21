import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import MemberDetail from './pages/MemberDetail';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<MembersList />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payments" element={<Payments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
