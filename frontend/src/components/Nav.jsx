import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LeafIcon, CameraIcon, TruckIcon, MapPinIcon, TrophyIcon, UserIcon, LogOutIcon, BuildingIcon, ShieldIcon } from './Icons';

export default function Nav() {
  const { user, selectedCampusId, setSelectedCampus, logout } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const links = [
    { to: '/', label: 'Home', icon: LeafIcon },
    { to: '/identify', label: 'Identify', icon: CameraIcon },
    { to: '/pickup', label: 'Pickup', icon: TruckIcon },
    { to: '/history', label: 'Impact', icon: TrophyIcon },
    { to: '/campus', label: 'Map', icon: MapPinIcon },
  ];

  if (user.role === 'staff' || user.role === 'admin') {
    links.push({ to: '/staff', label: 'Staff Hub', icon: ShieldIcon });
  }
  if (user.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin', icon: BuildingIcon });
  }

  const onLogout = () => {
    logout();
    nav('/login');
  };

  const campuses = Array.isArray(user.campusIds) ? user.campusIds : [];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-eco-border shadow-eco-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-eco-forest to-eco-teal flex items-center justify-center text-white shadow-eco-sm group-hover:scale-105 transition duration-200">
              <LeafIcon className="w-6 h-6 text-eco-lime" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-eco-forest tracking-tight flex items-center gap-1">
                WasteWise
                <span className="w-2 h-2 rounded-full bg-eco-lime animate-pulse" />
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-eco-secondary -mt-1">
                Campus Sustainability
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-eco-bg/80 p-1.5 rounded-2xl border border-eco-border">
            {links.map(l => {
              const Icon = l.icon;
              const active = loc.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white text-eco-forest shadow-eco-sm border border-eco-emerald/20'
                      : 'text-eco-secondary hover:text-eco-forest hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-eco-emerald' : ''}`} />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Campus Selector */}
          <div className="flex items-center gap-3">
            {/* Campus Switcher */}
            {campuses.length > 0 && (
              <div className="relative flex items-center">
                <BuildingIcon className="w-4 h-4 text-eco-secondary absolute left-3 pointer-events-none" />
                <select
                  className="pl-9 pr-7 py-1.5 bg-eco-bg border border-eco-border rounded-xl text-xs font-semibold text-eco-text focus:outline-none focus:ring-2 focus:ring-eco-emerald/30 cursor-pointer"
                  value={selectedCampusId || ''}
                  onChange={e => setSelectedCampus(e.target.value)}
                >
                  {campuses.map(c => {
                    const id = typeof c === 'string' ? c : c._id;
                    const name = typeof c === 'object' ? c.name : `Campus ${c}`;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-eco-bg border border-eco-border hover:border-eco-emerald/40 rounded-xl transition duration-150 text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-eco-forest text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-bold text-eco-text max-w-[100px] truncate">{user.name}</p>
                  <span className="text-[10px] uppercase font-semibold text-eco-emerald">{user.role}</span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-eco-border shadow-eco-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-eco-border mb-1">
                    <p className="font-bold text-sm text-eco-text">{user.name}</p>
                    <p className="text-xs text-eco-secondary truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-eco-mint text-eco-forest border border-eco-emerald/30">
                      {user.role} Role
                    </span>
                  </div>

                  <Link
                    to="/history"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-eco-secondary hover:text-eco-forest hover:bg-eco-mint rounded-xl transition"
                  >
                    <TrophyIcon className="w-4 h-4 text-eco-emerald" />
                    My Impact Dashboard
                  </Link>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition mt-1"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Bar (Fixed at Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-eco-border px-3 py-2 shadow-eco-lg">
        <div className="flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition ${
              loc.pathname === '/' ? 'text-eco-forest' : 'text-eco-muted hover:text-eco-secondary'
            }`}
          >
            <LeafIcon className="w-5 h-5" />
            Home
          </Link>

          <Link
            to="/history"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition ${
              loc.pathname === '/history' ? 'text-eco-forest' : 'text-eco-muted hover:text-eco-secondary'
            }`}
          >
            <TrophyIcon className="w-5 h-5" />
            Impact
          </Link>

          {/* Raised AI Scan Button */}
          <Link
            to="/identify"
            className="flex flex-col items-center -mt-6 group"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-eco-forest to-eco-teal p-3 text-white shadow-eco-glow group-hover:scale-105 transition duration-200 flex items-center justify-center border-4 border-white">
              <CameraIcon className="w-6 h-6 text-eco-lime" />
            </div>
            <span className="text-[10px] font-extrabold text-eco-forest mt-0.5">Scan AI</span>
          </Link>

          <Link
            to="/pickup"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition ${
              loc.pathname === '/pickup' ? 'text-eco-forest' : 'text-eco-muted hover:text-eco-secondary'
            }`}
          >
            <TruckIcon className="w-5 h-5" />
            Pickup
          </Link>

          <Link
            to="/campus"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition ${
              loc.pathname === '/campus' ? 'text-eco-forest' : 'text-eco-muted hover:text-eco-secondary'
            }`}
          >
            <MapPinIcon className="w-5 h-5" />
            Map
          </Link>
        </div>
      </div>
    </>
  );
}
