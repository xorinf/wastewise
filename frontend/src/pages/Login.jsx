import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const setSession = useAuthStore(s => s.setSession);
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const fn = mode === 'login' ? authApi.login : authApi.signup;
      const { token, user } = await fn(form);
      setSession({ token, user });
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">WasteWise</h1>
        <p className="text-sm text-gray-600">
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {mode === 'signup' && (
          <div>
            <label className="label">Name</label>
            <input className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="field" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>

        {err && <p className="text-sm text-red-700">{err}</p>}

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? '...' : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>

        <button type="button" className="text-sm text-gray-600 underline"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>

        <div className="text-xs text-gray-500 border-t pt-3">
          <p className="font-medium mb-1">Demo credentials (after running <code>npm run seed</code>):</p>
          <p>admin@wastewise.local / password123 (admin)</p>
          <p>staff@wastewise.local / password123 (staff)</p>
          <p>user@wastewise.local / password123 (user)</p>
        </div>
      </form>
    </div>
  );
}
