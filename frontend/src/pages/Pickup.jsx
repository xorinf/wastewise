import { useEffect, useState } from 'react';
import { requests as reqApi, campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { fillLabel, requestLabel, statusLabel } from '../utils/lookups';

export default function Pickup() {
  const { selectedCampusId } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [form, setForm] = useState({ building: '', floor: '', binId: '', fillStatus: 'full', requestType: 'pickup', quantity: 1, note: '' });
  const [recent, setRecent] = useState([]);
  const [toast, setToast] = useState(null); // { ok, msg }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedCampusId) return;
    campusApi.get(selectedCampusId).then(d => setCampus(d.campus)).catch(() => setCampus(null));
    reqApi.list().then(d => setRecent(d.requests)).catch(() => {});
  }, [selectedCampusId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setToast(null);
    try {
      const r = await reqApi.create({ ...form, campusId: selectedCampusId });
      setToast({ ok: true, msg: `Raised · ${r.request.status}${r.request.assignedTo ? ' · auto-assigned' : ''}` });
      setForm({ building: '', floor: '', binId: '', fillStatus: 'full', requestType: 'pickup', quantity: 1, note: '' });
      const list = await reqApi.list(); setRecent(list.requests);
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.error || 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedCampusId) {
    return <main className="max-w-2xl mx-auto p-8"><p className="text-gray-700">Pick a campus first (top right).</p></main>;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const filterBins = (extra = {}) => (campus?.bins || []).filter(
    b => (!form.building || b.building === form.building)
      && (!form.floor || b.floor === form.floor)
      && Object.entries(extra).every(([k, v]) => !v || b[k] === v)
  );
  const buildings = Array.from(new Set((campus?.bins || []).map(b => b.building)));
  const floors = Array.from(new Set(filterBins({ building: 1 }).map(b => b.floor)));

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Report pickup / supply</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* Form (left) */}
        <form onSubmit={submit} className="card space-y-3">
          <h2 className="font-semibold">New request</h2>
          <p className="text-xs text-gray-500 -mt-2">campus: <strong>{campus?.name || '...'}</strong></p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Building</label>
              <input className="field" value={form.building} onChange={set('building')} list="buildings" required />
              <datalist id="buildings">{buildings.map(b => <option key={b} value={b} />)}</datalist>
            </div>
            <div>
              <label className="label">Floor</label>
              <input className="field" value={form.floor} onChange={set('floor')} list="floors" required />
              <datalist id="floors">{floors.map(f => <option key={f} value={f} />)}</datalist>
            </div>
          </div>

          <div>
            <label className="label">Bin ID</label>
            <input className="field" value={form.binId} onChange={set('binId')} list="binids" required />
            <datalist id="binids">{filterBins({ building: 1, floor: 1 }).map(b => <option key={b._id} value={b.binId} />)}</datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fill status</label>
              <select className="field" value={form.fillStatus} onChange={set('fillStatus')}>
                <option value="full">Full</option>
                <option value="nearly_full">Nearly Full</option>
                <option value="overflowing">Overflowing</option>
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="field" value={form.requestType} onChange={set('requestType')}>
                <option value="pickup">Pickup</option>
                <option value="new_bin">New bin</option>
                <option value="bin_cover">Bin cover</option>
                <option value="bags_liners">Bags / liners</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
            <div>
              <label className="label">Qty</label>
              <input className="field !w-20" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input className="field" value={form.note} onChange={set('note')} placeholder="e.g. smell, lid broken" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button className="btn btn-primary" disabled={saving}>{saving ? '...' : 'Raise request'}</button>
            {toast && (
              <span className={`text-sm ${toast.ok ? 'text-gray-700' : 'text-red-700'}`}>{toast.msg}</span>
            )}
          </div>
        </form>

        {/* Recent requests (right) */}
        <div className="card lg:max-h-[70vh] lg:overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">My recent requests</h2>
            <span className="chip">{recent.length}</span>
          </div>
          {recent.length === 0 && <p className="text-sm text-gray-600">None yet.</p>}
          <ul className="divide-y">
            {recent.map(r => (
              <li key={r._id} className="py-2 text-sm flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.building} · {r.floor} · Bin {r.binId}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {fillLabel(r.fillStatus)} · {requestLabel(r.requestType)} · qty {r.quantity}
                    {' · '}{new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="chip self-start shrink-0">{statusLabel(r.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
