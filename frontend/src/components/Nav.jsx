import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Nav() {
  const { user, selectedCampusId, setSelectedCampus, linkCampus, logout } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [linkCode, setLinkCode] = useState('');
  const [linkErr, setLinkErr] = useState('');
  const [linking, setLinking] = useState(false);

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

  const campusIds = Array.isArray(user.campusIds) ? user.campusIds : [];
  const hasMany = campusIds.length > 1;
  const hasAny = campusIds.length > 0;
  const needsLink = !hasAny;

  const onLogout = () => { logout(); nav('/login'); };

  const submitLink = async (e) => {
    e.preventDefault();
    setLinkErr('');
    const code = linkCode.trim();
    if (!code) { setLinkErr('Enter a campus code'); return; }
    setLinking(true);
    try {
      await linkCampus(code);
      setLinkCode('');
    } catch (err) {
      setLinkErr(err.response?.data?.error || 'Could not link');
    } finally {
      setLinking(false);
    }
  };

  // Resolve a campus id to a readable label + the id itself.
  const labelOf = (id) => typeof id === 'object' && id !== null
    ? (id.name || id.code || id._id)
    : null;
  const idOf = (id) => typeof id === 'string' ? id : (id?._id || id?.toString?.() || '');
  const activeLabel = hasAny
    ? (labelOf(campusIds[0]) || (selectedCampusId ? `Campus ${selectedCampusId.slice(-4)}` : null))
    : null;

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
          {/* Zero campuses: show inline "link a campus" form so the user isn't
             dead-ended by the "Pick a campus first" gate. */}
          {needsLink ? (
            <form onSubmit={submitLink} className="flex items-center gap-1">
              <input
                className="field !py-1 !text-sm !w-32"
                placeholder="campus code"
                value={linkCode}
                onChange={e => setLinkCode(e.target.value)}
                maxLength={20}
              />
              <button className="btn !py-1 !px-2 !text-sm" disabled={linking}>
                {linking ? '...' : 'Link'}
              </button>
              {linkErr && <span className="text-red-700 text-xs ml-1">{linkErr}</span>}
            </form>
          ) : hasMany ? (
            // Multi-campus user: keep the original dropdown.
            <select className="field !py-1 !text-sm w-auto" value={selectedCampusId || ''}
              onChange={e => setSelectedCampus(e.target.value)}>
              {campusIds.map(id => (
                <option key={idOf(id)} value={idOf(id)}>{labelOf(id) || `Campus ${idOf(id)}`}</option>
              ))}
            </select>
          ) : activeLabel ? (
            // Single campus: show the name as static text so users know
            // which one is active. (PRD says selector is for >1 campus.)
            <span className="chip">{activeLabel}</span>
          ) : null}

          <span className="text-gray-600">{user.name} ({user.role})</span>
          <button className="btn !py-1 !px-3 !text-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
