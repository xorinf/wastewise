import { useEffect, useRef, useState } from 'react';
import { campuses as campusApi, pins as pinsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import CampusMap from '../components/CampusMap';

const KIND_COLOR = {
  hazard: '#dc2626', broken_bin: '#f59e0b', no_signage: '#7c3aed',
  request_supplies: '#2563eb', other: '#6b7280',
};
const KIND_LABEL = {
  hazard: 'Hazard', broken_bin: 'Broken bin', no_signage: 'No signage',
  request_supplies: 'Need supplies', other: 'Other',
};
const KIND_VALUES = Object.keys(KIND_COLOR);

export default function Campus() {
  const { selectedCampusId, user } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [pins, setPins] = useState([]);
  const [nearest, setNearest] = useState(null);
  const [pendingPin, setPendingPin] = useState(null);
  const [pinForm, setPinForm] = useState({ kind: 'hazard', note: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const studentMarkerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const canDropPin = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    if (!selectedCampusId) return;
    setCampus(null); setPins([]); setNearest(null);
    Promise.all([campusApi.get(selectedCampusId), pinsApi.listByCampus(selectedCampusId, 'open')])
      .then(([c, p]) => { setCampus(c.campus); setPins(p.pins || []); })
      .catch(e => setErr(e.message));
  }, [selectedCampusId]);

  async function handleMapClick({ lat, lng }) {
    if (canDropPin) {
      setPendingPin({ lat, lng });
      setPinForm({ kind: 'hazard', note: '' });
    } else {
      findNearest(lat, lng);
    }
  }

  async function findNearest(lat, lng) {
    try {
      const r = await campusApi.nearestBin(selectedCampusId, lat, lng);
      if (!r.bin) { setErr('No located bins on this campus yet.'); return; }
      setNearest({ bin: r.bin, distanceMeters: r.distanceMeters, origin: { lat, lng } });
      setErr('');
      // Scroll into view for the result card.
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { setErr(e.response?.data?.error || 'Failed'); }
  }

  async function submitPin(e) {
    e.preventDefault();
    if (!pendingPin) return;
    setBusy(true); setErr('');
    try {
      const r = await pinsApi.create({
        campusId: selectedCampusId,
        lat: pendingPin.lat, lng: pendingPin.lng,
        kind: pinForm.kind, note: pinForm.note,
      });
      setPins(p => [r.pin, ...p]);
      setPendingPin(null);
    } catch (e2) { setErr(e2.response?.data?.error || 'Failed to drop pin'); }
    finally { setBusy(false); }
  }

  if (!selectedCampusId) return <CampusLinkPrompt />;
  if (!campus) return <main className="max-w-4xl mx-auto p-8"><p className="text-gray-600">Loading…</p></main>;

  const located = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
  const binsNoCoords = (campus.bins || []).filter(b => b.lat == null || b.lng == null);

  // Pick marker for the pending pin location.
  const dragMarker = pendingPin ? { lat: pendingPin.lat, lng: pendingPin.lng } : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{campus.name}</h1>
        <div className="flex gap-2 text-xs">
          <span className="chip">{located.length} of {(campus.bins||[]).length} bins located</span>
          <span className="chip">{pins.length} open pins</span>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Click the map: {canDropPin
          ? 'staff/admin can drop a pin, or click an existing bin to focus it.'
          : 'we find the nearest bin to that point.'}
      </p>

      <div ref={mapContainerRef}>
        <CampusMap
          bins={located}
          pins={pins}
          dragMarker={dragMarker}
          onSelect={handleMapClick}
          height={480}
        />
      </div>

      {canDropPin && pendingPin && (
        <form onSubmit={submitPin} className="card space-y-3 border-gray-900 border-2">
          <h2 className="font-semibold">Drop pin</h2>
          <p className="text-xs text-gray-500">lat {pendingPin.lat.toFixed(5)}, lng {pendingPin.lng.toFixed(5)} (drag the pin to adjust)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kind</label>
              <select className="field" value={pinForm.kind} onChange={e => setPinForm({ ...pinForm, kind: e.target.value })}>
                {KIND_VALUES.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input className="field" value={pinForm.note} onChange={e => setPinForm({ ...pinForm, note: e.target.value })} maxLength={280} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy}>{busy ? '...' : 'Save pin'}</button>
            <button type="button" className="btn" onClick={() => setPendingPin(null)}>Cancel</button>
          </div>
        </form>
      )}

      {nearest && nearest.bin && (
        <div className="card border-gray-900 border-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Nearest bin</p>
          <p className="font-medium">
            {nearest.bin.binId} · {nearest.bin.building} · floor {nearest.bin.floor}
          </p>
          <p className="text-sm text-gray-600">≈ {nearest.distanceMeters} m from where you clicked</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(KIND_LABEL).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: KIND_COLOR[k] }} />
            <span className="text-gray-700">{label}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#4b5563' }} />
          <span className="text-gray-700">Bin</span>
        </span>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {binsNoCoords.length > 0 && (
        <p className="text-xs text-gray-500">{binsNoCoords.length} bins without coordinates — admin can add them under Admin &gt; Bin coordinates.</p>
      )}
    </main>
  );
}

/** Inline form shown when the user has no campus selected. */
function CampusLinkPrompt() {
  const linkCampus = useAuthStore(s => s.linkCampus);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) { setErr('Enter a campus code (try MAIN)'); return; }
    setBusy(true); setErr('');
    try { await linkCampus(trimmed); }
    catch (e2) { setErr(e2.response?.data?.error || 'Could not link'); }
    finally { setBusy(false); }
  };

  return (
    <main className="max-w-md mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Link a campus</h1>
      <p className="text-sm text-gray-600">
        You aren't linked to any campus yet. Enter the campus code your admin shared with you (e.g. <code>MAIN</code>) and we'll wire you up.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="field"
          placeholder="campus code"
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={20}
        />
        <button className="btn btn-primary" disabled={busy}>{busy ? '...' : 'Link'}</button>
      </form>
      {err && <p className="text-sm text-red-700">{err}</p>}
    </main>
  );
}
