import React, { useEffect, useState } from 'react';
import { requests as reqApi, campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { fillLabel, requestLabel, statusLabel } from '../utils/lookups';
import { TruckIcon, BuildingIcon, CheckCircleIcon, AlertTriangleIcon, SparklesIcon } from '../components/Icons';
import { EmptyState } from '../components/UI';

export default function Pickup() {
  const { selectedCampusId } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [form, setForm] = useState({
    building: '',
    floor: '',
    binId: '',
    fillStatus: 'full',
    requestType: 'pickup',
    quantity: 1,
    note: ''
  });
  const [recent, setRecent] = useState([]);
  const [toast, setToast] = useState(null); // { ok, msg }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedCampusId) return;
    campusApi.get(selectedCampusId).then(d => setCampus(d.campus)).catch(() => setCampus(null));
    reqApi.list().then(d => setRecent(d.requests || [])).catch(() => {});
  }, [selectedCampusId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const r = await reqApi.create({ ...form, campusId: selectedCampusId });
      setToast({ ok: true, msg: `Pickup Request #${r.request._id.slice(-4)} Raised! ${r.request.assignedTo ? 'Auto-assigned to staff.' : 'Pending dispatch.'}` });
      setForm({ building: '', floor: '', binId: '', fillStatus: 'full', requestType: 'pickup', quantity: 1, note: '' });
      const list = await reqApi.list();
      setRecent(list.requests || []);
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.error || 'Failed to submit request' });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedCampusId) {
    return (
      <main className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <EmptyState
          icon={BuildingIcon}
          title="Select a Campus First"
          description="Please choose your active campus from the top right navigation bar to report bin pickups."
        />
      </main>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const filterBins = (extra = {}) => (campus?.bins || []).filter(
    b => (!form.building || b.building === form.building)
      && (!form.floor || b.floor === form.floor)
      && Object.entries(extra).every(([k, v]) => !v || b[k] === v)
  );
  const buildings = Array.from(new Set((campus?.bins || []).map(b => b.building)));
  const floors = Array.from(new Set(filterBins({ building: 1 }).map(b => b.floor)));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="chip border-amber-200 bg-amber-50 text-amber-800 font-bold">🟡 Pending</span>;
      case 'assigned':
        return <span className="chip border-blue-200 bg-blue-50 text-blue-800 font-bold">🔵 Assigned</span>;
      case 'resolved':
        return <span className="chip border-emerald-200 bg-emerald-50 text-emerald-800 font-bold">🟢 Resolved</span>;
      default:
        return <span className="chip font-bold">{statusLabel(status)}</span>;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
          <TruckIcon className="w-4 h-4 text-eco-emerald" />
          Campus Waste Management & Supplies
        </div>
        <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
          Request a Pickup 🚛
        </h1>
        <p className="text-xs sm:text-sm text-eco-secondary">
          Flag full or overflowing bins, or request replacement bags and covers for your campus building.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Card (Left Column) */}
        <form onSubmit={submit} className="lg:col-span-6 card space-y-5">
          <div className="border-b border-eco-border pb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-eco-text">New Request Form</h2>
            <span className="text-xs font-bold text-eco-forest bg-eco-mint px-2.5 py-1 rounded-full border border-eco-emerald/20">
              🏫 {campus?.name || 'Loading Campus...'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Building Name</label>
              <input
                className="field"
                placeholder="e.g. Block A"
                value={form.building}
                onChange={set('building')}
                list="buildings"
                required
              />
              <datalist id="buildings">{buildings.map(b => <option key={b} value={b} />)}</datalist>
            </div>
            <div>
              <label className="label">Floor Level</label>
              <input
                className="field"
                placeholder="e.g. Ground Floor"
                value={form.floor}
                onChange={set('floor')}
                list="floors"
                required
              />
              <datalist id="floors">{floors.map(f => <option key={f} value={f} />)}</datalist>
            </div>
          </div>

          <div>
            <label className="label">Target Bin ID</label>
            <input
              className="field"
              placeholder="e.g. A-G-01"
              value={form.binId}
              onChange={set('binId')}
              list="binids"
              required
            />
            <datalist id="binids">
              {filterBins({ building: 1, floor: 1 }).map(b => <option key={b._id} value={b.binId} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fill Condition</label>
              <select className="field" value={form.fillStatus} onChange={set('fillStatus')}>
                <option value="full">Full (100%)</option>
                <option value="nearly_full">Nearly Full (75%)</option>
                <option value="overflowing">Overflowing (Critical)</option>
              </select>
            </div>
            <div>
              <label className="label">Request Type</label>
              <select className="field" value={form.requestType} onChange={set('requestType')}>
                <option value="pickup">Standard Bin Pickup</option>
                <option value="new_bin">Need New Bin</option>
                <option value="bin_cover">Need Bin Cover</option>
                <option value="bags_liners">Need Bags & Liners</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div>
              <label className="label">Quantity</label>
              <input
                className="field"
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">Additional Notes (Optional)</label>
              <input
                className="field"
                value={form.note}
                onChange={set('note')}
                placeholder="e.g. Lid broken, odor issue"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2" disabled={saving}>
              <TruckIcon className="w-5 h-5 text-eco-lime" />
              <span>{saving ? 'Submitting Request...' : 'Submit Pickup Request'}</span>
            </button>

            {toast && (
              <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {toast.ok ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> : <AlertTriangleIcon className="w-4 h-4 text-red-600" />}
                <span>{toast.msg}</span>
              </div>
            )}
          </div>
        </form>

        {/* Recent Requests Card (Right Column) */}
        <div className="lg:col-span-6 card space-y-4 lg:max-h-[700px] lg:overflow-auto">
          <div className="flex items-center justify-between border-b border-eco-border pb-3">
            <h2 className="font-extrabold text-lg text-eco-text">My Recent Pickup Requests</h2>
            <span className="chip font-bold">{recent.length} Requests</span>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={TruckIcon}
              title="No Pickup Requests Yet 🚛"
              description="When you report full bins or request supplies, your live status tracking cards will appear here."
            />
          ) : (
            <div className="divide-y divide-eco-border">
              {recent.map(r => (
                <div key={r._id} className="py-3.5 space-y-2 hover:bg-eco-mint/20 px-2 rounded-xl transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-sm text-eco-text">
                        {r.building} · {r.floor} · <span className="text-eco-forest font-bold">Bin #{r.binId}</span>
                      </p>
                      <p className="text-xs text-eco-secondary mt-0.5">
                        {fillLabel(r.fillStatus)} · {requestLabel(r.requestType)} · Qty: {r.quantity}
                      </p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  {r.note && (
                    <p className="text-xs text-eco-secondary italic bg-eco-bg p-2 rounded-lg border border-eco-border">
                      "{r.note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-eco-muted pt-1">
                    <span>Raised: {new Date(r.createdAt).toLocaleString()}</span>
                    {r.assignedTo && <span className="font-semibold text-eco-forest">Assigned to staff</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </main>
  );
}
