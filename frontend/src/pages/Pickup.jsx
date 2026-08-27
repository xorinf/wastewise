import { useEffect, useState } from 'react';
import { requests as reqApi, campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { fillLabel, requestLabel, statusLabel } from '../utils/lookups';

export default function Pickup() {
  const { selectedCampusId, user } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [form, setForm] = useState({ building: '', floor: '', binId: '', fillStatus: 'full', requestType: 'pickup', quantity: 1, note: '' });
  const [recent, setRecent] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!selectedCampusId) return;
    campusApi.get(selectedCampusId).then(d => setCampus(d.campus)).catch(() => setCampus(null));
    reqApi.list().then(d => setRecent(d.requests)).catch(() => {});
  }, [selectedCampusId]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg(''); setForm({ building: '', floor: '', binId: '', fillStatus: 'full', requestType: 'pickup', quantity: 1, note: '' });
    try {
      const r = await reqApi.create({ ...form, campusId: selectedCampusId });
      setMsg(`Request raised. Status: ${r.request.status}${r.request.assignedTo ? ' (auto-assigned to zone staff)' : ''}.`);
      const list = await reqApi.list(); setRecent(list.requests);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to raise request');
    }
  };

  if (!selectedCampusId) {
    return <main className="max-w-2xl mx-auto p-8"><p className="text-gray-700">Pick a campus first (top right).</p></main>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Report pickup / supply</h1>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="label">Campus</label>
          <p className="field !cursor-default">{campus?.name || '(loading)'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Building</label>
            <input className="field" value={form.building}
              onChange={e => setForm({ ...form, building: e.target.value })}
              list="buildings" required />
            <datalist id="buildings">
              {Array.from(new Set((campus?.bins || []).map(b => b.building))).map(b => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Floor</label>
            <input className="field" value={form.floor}
              onChange={e => setForm({ ...form, floor: e.target.value })}
              list="floors" required />
            <datalist id="floors">
              {Array.from(new Set((campus?.bins || []).filter(b => !form.building || b.building === form.building).map(b => b.floor))).map(f => <option key={f} value={f} />)}
            </datalist>
          </div>
        </div>
        <div>
          <label className="label">Bin ID</label>
          <input className="field" value={form.binId}
            onChange={e => setForm({ ...form, binId: e.target.value })}
            list="binids" required />
          <datalist id="binids">
            {(campus?.bins || [])
              .filter(b => (!form.building || b.building === form.building) && (!form.floor || b.floor === form.floor))
              .map(b => <option key={b._id} value={b.binId} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fill status</label>
            <select className="field" value={form.fillStatus} onChange={e => setForm({ ...form, fillStatus: e.target.value })}>
              <option value="full">Full</option>
              <option value="nearly_full">Nearly Full</option>
              <option value="overflowing">Overflowing</option>
            </select>
          </div>
          <div>
            <label className="label">Request type</label>
            <select className="field" value={form.requestType} onChange={e => setForm({ ...form, requestType: e.target.value })}>
              <option value="pickup">Pickup needed</option>
              <option value="new_bin">New bin</option>
              <option value="bin_cover">Bin cover</option>
              <option value="bags_liners">Bags / liners</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input className="field !w-32" type="number" min="1" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <textarea className="field" rows="2" value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })} />
        </div>
        <button className="btn btn-primary">Raise request</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">My recent requests</h2>
        {recent.length === 0 && <p className="text-sm text-gray-600">None yet.</p>}
        <ul className="divide-y">
          {recent.map(r => (
            <li key={r._id} className="py-2 text-sm flex justify-between">
              <div>
                <p className="font-medium">{r.building} · {r.floor} · Bin {r.binId}</p>
                <p className="text-xs text-gray-500">
                  {fillLabel(r.fillStatus)} · {requestLabel(r.requestType)} · qty {r.quantity}
                  {' · '}{new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="chip">{statusLabel(r.status)}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
