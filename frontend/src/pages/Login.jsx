import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { LeafIcon, SparklesIcon, ShieldIcon, RecycleIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from '../components/Icons';

export default function Login() {
  const setSession = useAuthStore(s => s.setSession);
  const nav = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? authApi.login : authApi.signup;
      const { token, user } = await fn(form);
      setSession({ token, user });
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (email, password) => {
    setMode('login');
    setForm({ name: '', email, password });
    setErr('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-eco-border shadow-eco-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Hero Section (Eco Arctic / Tech Visual) */}
        <div className="lg:col-span-6 eco-hero-gradient p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Eco Orbs background */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-eco-emerald/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-eco-lime/10 blur-3xl" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-eco-lime">
              <LeafIcon className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
              WasteWise
              <span className="w-2 h-2 rounded-full bg-eco-lime animate-pulse" />
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-eco-lime">
              <SparklesIcon className="w-4 h-4" />
              AI-Powered Campus Sustainability
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Sort Smart. <br />
              Live Green. <br />
              <span className="text-eco-lime">Zero Waste Campus.</span>
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed max-w-md">
              Classify waste with Gemini AI, earn eco points, track carbon diversion, and keep your campus clean with instant pickup requests.
            </p>

            {/* Feature Pills */}
            <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <RecycleIcon className="w-4 h-4 text-eco-lime" />
                <span>Smart AI Bin Mapping</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <ShieldIcon className="w-4 h-4 text-eco-lime" />
                <span>Verified Impact Stats</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Quote */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-emerald-200/70 flex items-center justify-between">
            <span>Building sustainable habits together</span>
            <span className="text-eco-lime font-bold">v2.0</span>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header Tabs */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-eco-text">
                  {mode === 'login' ? 'Welcome back 👋' : 'Join WasteWise 🌱'}
                </h2>
                <p className="text-xs text-eco-secondary mt-1">
                  {mode === 'login' ? 'Enter your credentials to access your account' : 'Create an account to start tracking your eco impact'}
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="bg-eco-bg p-1 rounded-xl border border-eco-border flex text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`px-3 py-1.5 rounded-lg transition ${mode === 'login' ? 'bg-white text-eco-forest shadow-eco-sm' : 'text-eco-secondary'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`px-3 py-1.5 rounded-lg transition ${mode === 'signup' ? 'bg-white text-eco-forest shadow-eco-sm' : 'text-eco-secondary'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {err && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2">
                <span>⚠️</span>
                <span>{err}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="e.g. Alex Rivera"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="field"
                  placeholder="student@wastewise.local"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="field pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-muted hover:text-eco-text transition"
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group mt-2"
              >
                <span>{loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In to Dashboard' : 'Create My Account')}</span>
                {!loading && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition" />}
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Autofill Panel */}
          <div className="mt-8 pt-6 border-t border-eco-border space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-eco-secondary flex items-center gap-1.5">
              <span>⚡</span> Quick Demo Login (Click to fill)
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => autofillDemo('user@wastewise.local', 'password123')}
                className="p-2 rounded-xl bg-eco-bg hover:bg-eco-mint border border-eco-border hover:border-eco-emerald/30 transition text-left"
              >
                <p className="font-bold text-eco-forest text-[11px]">Student</p>
                <p className="text-[10px] text-eco-muted truncate">user@wastewise.local</p>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('staff@wastewise.local', 'password123')}
                className="p-2 rounded-xl bg-eco-bg hover:bg-eco-mint border border-eco-border hover:border-eco-emerald/30 transition text-left"
              >
                <p className="font-bold text-eco-forest text-[11px]">Staff</p>
                <p className="text-[10px] text-eco-muted truncate">staff@wastewise.local</p>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('admin@wastewise.local', 'password123')}
                className="p-2 rounded-xl bg-eco-bg hover:bg-eco-mint border border-eco-border hover:border-eco-emerald/30 transition text-left"
              >
                <p className="font-bold text-eco-forest text-[11px]">Admin</p>
                <p className="text-[10px] text-eco-muted truncate">admin@wastewise.local</p>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
