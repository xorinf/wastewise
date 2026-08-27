import { useEffect, useRef, useState } from 'react';
import { campuses as campusApi, pins as pinsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default Leaflet marker icons on Vite (assets paths break by default).
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import icon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl: icon2xUrl, shadowUrl });

const KIND_COLOR = {
  hazard: '#dc2626',
  broken_bin: '#f59e0b',
  no_signage: '#7c3aed',
  request_supplies: '#2563eb',
  other: '#6b7280',
};
const KIND_LABEL = {
  hazard: 'Hazard',
  broken_bin: 'Broken bin',
  no_signage: 'No signage',
  request_supplies: 'Need supplies',
  other: 'Other',
};
const KIND_VALUES = Object.keys(KIND_COLOR);

export default function Campus() {
  const { selectedCampusId, user } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [pins, setPins] = useState([]);
  const [nearest, setNearest] = useState(null); // { bin, distanceMeters }
  const [pendingPin, setPendingPin] = useState(null); // { lat, lng }
  const [pinForm, setPinForm] = useState({ kind: 'hazard', note: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const markersRef = useRef({ bins: [], pins: [] });
  const studentMarkerRef = useRef(null);

  const canDropPin = user?.role === 'staff' || user?.role === 'admin';

  // Load campus + open pins.
  useEffect(() => {
    if (!selectedCampusId) return;
    setCampus(null); setPins([]); setNearest(null);
    Promise.all([
      campusApi.get(selectedCampusId),
      pinsApi.listByCampus(selectedCampusId, 'open'),
    ])
      .then(([c, p]) => { setCampus(c.campus); setPins(p.pins || []); })
      .catch(e => setErr(e.message));
  }, [selectedCampusId]);

  // Init Leaflet once we have a campus.
  useEffect(() => {
    if (!campus || !mapElRef.current || mapRef.current) return;
    const center = computeCentroid(campus.bins || []);
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(center || [12.9716, 77.5946], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    map.on('click', (e) => handleMapClick(e.latlng));
    if (center) map.fitBounds(L.latLngBounds(center.map(c => L.latLng(...c))).pad(0.5));

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus]);

  function handleMapClick(latlng) {
    if (canDropPin) {
      setPendingPin({ lat: latlng.lat, lng: latlng.lng });
      setPinForm({ kind: 'hazard', note: '' });
    } else {
      // Student: clicking the map means "find nearest bin to this point".
      findNearest(latlng.lat, latlng.lng);
    }
  }

  async function findNearest(lat, lng) {
    try {
      const r = await campusApi.nearestBin(selectedCampusId, lat, lng);
      if (!r.bin) { setErr('No located bins on this campus yet.'); return; }
      setNearest({ bin: r.bin, distanceMeters: r.distanceMeters, origin: { lat, lng } });
      setErr('');
      if (studentMarkerRef.current) mapRef.current.removeLayer(studentMarkerRef.current);
      studentMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 7, color: '#111827', weight: 2, fillOpacity: 0.9,
      }).addTo(mapRef.current).bindTooltip('You were here');
    } catch (e) { setErr(e.response?.data?.error || 'Failed'); }
  }

  async function submitPin(e) {
    e.preventDefault();
    if (!pendingPin) return;
    setBusy(true); setErr('');
    try {
      const r = await pinsApi.create({
        campusId: selectedCampusId,
        lat: pendingPin.lat,
        lng: pendingPin.lng,
        kind: pinForm.kind,
        note: pinForm.note,
      });
      setPins(p => [r.pin, ...p]);
      setPendingPin(null);
    } catch (e2) { setErr(e2.response?.data?.error || 'Failed to drop pin'); }
    finally { setBusy(false); }
  }

  // Render bin markers whenever the campus changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !campus) return;
    markersRef.current.bins.forEach(m => map.removeLayer(m));
    markersRef.current.bins = [];
    const located = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
    for (const b of located) {
      const m = L.circleMarker([b.lat, b.lng], {
        radius: 9, color: '#111827', weight: 2,
        fillColor: '#4b5563', fillOpacity: 0.9,
      }).addTo(map).bindPopup(
        `<div class="text-sm"><strong>${escapeHtml(b.binId)}</strong><br>${escapeHtml(b.building)} · floor ${escapeHtml(b.floor)}<br><button data-binid="${escapeHtml(b.binId)}" class="text-xs underline mt-1">Find nearest to here</button></div>`
      );
      markersRef.current.bins.push(m);
    }
    map.on('popupopen', (e) => {
      const btn = e.popup.getElement().querySelector('button[data-binid]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const bin = located.find(x => x.binId === btn.dataset.binid);
        if (bin) {
          map.setView([bin.lat, bin.lng], 19);
          findNearest(bin.lat, bin.lng);
        }
      }, { once: true });
    });
  }, [campus]);

  // Render pin markers whenever pins change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.pins.forEach(m => map.removeLayer(m));
    markersRef.current.pins = [];
    for (const p of pins) {
      const color = KIND_COLOR[p.kind] || '#6b7280';
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 7, color, weight: 2,
        fillColor: color, fillOpacity: 0.85,
      }).addTo(map).bindPopup(
        `<div class="text-sm"><strong>${escapeHtml(KIND_LABEL[p.kind] || p.kind)}</strong>`
        + (p.note ? `<br><span>${escapeHtml(p.note)}</span>` : '')
        + (canDropPin ? `<br><button data-pinresolve="${p._id}" class="text-xs underline mt-1">Mark resolved</button>` : '')
        + '</div>'
      );
      markersRef.current.pins.push(m);
    }
    if (canDropPin) {
      map.on('popupopen', (e) => {
        const btn = e.popup.getElement().querySelector('button[data-pinresolve]');
        if (!btn) return;
        btn.addEventListener('click', async () => {
          try {
            await pinsApi.setStatus(btn.dataset.pinresolve, 'resolved');
            setPins(prev => prev.filter(pp => pp._id !== btn.dataset.pinresolve));
          } catch {}
        }, { once: true });
      });
    }
  }, [pins, canDropPin]);

  if (!selectedCampusId) {
    return <main className="max-w-2xl mx-auto p-8"><p className="text-gray-700">Pick a campus first (top right).</p></main>;
  }
  if (!campus) {
    return <main className="max-w-4xl mx-auto p-8"><p className="text-gray-600">Loading…</p></main>;
  }

  const located = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
  const binsNoCoords = (campus.bins || []).filter(b => b.lat == null || b.lng == null);

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

      <div ref={mapElRef} className="w-full h-[480px] rounded-md border border-gray-300 overflow-hidden" />

      {/* Pending pin form (staff/admin) */}
      {canDropPin && pendingPin && (
        <form onSubmit={submitPin} className="card space-y-3 border-gray-900 border-2">
          <h2 className="font-semibold">Drop pin</h2>
          <p className="text-xs text-gray-500">lat {pendingPin.lat.toFixed(5)}, lng {pendingPin.lng.toFixed(5)}</p>
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

      {/* Nearest-result card (students) */}
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

function computeCentroid(bins) {
  const located = bins.filter(b => b.lat != null && b.lng != null);
  if (!located.length) return null;
  const sum = located.reduce((a, b) => ({ lat: a.lat + b.lat, lng: a.lng + b.lng }), { lat: 0, lng: 0 });
  return [sum.lat / located.length, sum.lng / located.length];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

