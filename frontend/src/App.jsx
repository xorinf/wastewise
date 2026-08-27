import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Login from './pages/Login';
import Home from './pages/Home';
import Identify from './pages/Identify';
import History from './pages/History';
import Pickup from './pages/Pickup';
import StaffDashboard from './pages/StaffDashboard';
import CampusPage from './pages/Campus';
import Admin from './pages/Admin';
import { useAuthStore } from './store/authStore';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/identify" element={<RequireAuth><Identify /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/pickup" element={<RequireAuth><Pickup /></RequireAuth>} />
          <Route path="/staff" element={<RequireAuth><StaffDashboard /></RequireAuth>} />
          <Route path="/campus" element={<RequireAuth><CampusPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
