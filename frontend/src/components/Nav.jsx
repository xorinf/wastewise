import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Nav() {
  const { user, selectedCampusId, setSelectedCampus, logout } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Home' },
    { to: '/identify', label: 'Identify Item' },
    { to: '/pickup', label: 'Report Pickup' },
    { to: '/history', label: 'My Impact' },
    { to: '/campus', label: 'Campus Map' },
  ];
  if (user.role === 'staff' || user.role === 'admin') {
    links.push({ to: '/staff', label: 'Staff Dashboard' });
  }
  if (user.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin' });
  }

  const onLogout = () => { logout(); nav('/login'); };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">WasteWise</Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-2 py-1 rounded ${loc.pathname === l.to ? 'border border-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {Array.isArray(user.campusIds) && user.campusIds.length > 1 && (
            <select className="field !py-1 !text-sm w-auto" value={selectedCampusId || ''}
              onChange={e => setSelectedCampus(e.target.value)}>
              {user.campusIds.map(id => (
                <option key={typeof id === 'string' ? id : id._id} value={typeof id === 'string' ? id : id._id}>
                  {typeof id === 'object' ? id.name : `Campus ${id}`}
                </option>
              ))}
            </select>
          )}
          <span className="text-gray-600">{user.name} ({user.role})</span>
          <button className="btn !py-1 !px-3 !text-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
