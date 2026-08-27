import React, { useEffect, useRef, useState } from 'react';
import { campuses as campusApi, pins as pinsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { MapPinIcon, ShieldIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon } from '../components/Icons';
import { EmptyState } from '../components/UI';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  hazard: 'Hazard Flag',
  broken_bin: 'Broken Bin',
  no_signage: 'No Signage',
  request_supplies: 'Need Supplies',
  other: 'Other Issue',
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

  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const markersRef = useRef({ bins: [], pins: [] });
  const studentMarkerRef = useRef(null);

  const canDropPin = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    if (!selectedCampusId) return;
    setCampus(null);
    setPins([]);
    setNearest(null);
    Promise.all([
      campusApi.get(selectedCampusId),
      pinsApi.listByCampus(selectedCampusId, 'open'),
    ])
      .then(([c, p]) => {
        setCampus(c.campus);
        setPins(p.pins || []);
      })
      .catch(e => setErr(e.message));
  }, [selectedCampusId]);

  useEffect(() => {
    if (!campus || !mapElRef.current || mapRef.current) return;
    const center = computeCentroid(campus.bins || []);
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(center || [12.9716, 77.5946], 17);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    
    mapRef.current = map;

    map.on('click', (e) => handleMapClick(e.latlng));
    if (center) map.fitBounds(L.latLngBounds(center.map(c => L.latLng(...c))).pad(0.5));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [campus]);

  function handleMapClick(latlng) {
    if (canDropPin) {
      setPendingPin({ lat: latlng.lat, lng: latlng.lng });
      setPinForm({ kind: 'hazard', note: '' });
    } else {
      findNearest(latlng.lat, latlng.lng);
    }
  }

  async function findNearest(lat, lng) {
    try {
      const r = await campusApi.nearestBin(selectedCampusId, lat, lng);
      if (!r.bin) {
        setErr('No located bins on this campus yet.');
        return;
      }
      setNearest({ bin: r.bin, distanceMeters: r.distanceMeters, origin: { lat, lng } });
      setErr('');
      if (studentMarkerRef.current) mapRef.current.removeLayer(studentMarkerRef.current);
      studentMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#14532D',
        weight: 3,
        fillColor: '#A3E635',
        fillOpacity: 0.9,
      }).addTo(mapRef.current).bindTooltip('Your Clicked Position', { permanent: true });
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to locate nearest bin');
    }
  }

  async function submitPin(e) {
    e.preventDefault();
    if (!pendingPin) return;
    setBusy(true);
    setErr('');
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
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to drop pin');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !campus) return;
    markersRef.current.bins.forEach(m => map.removeLayer(m));
    markersRef.current.bins = [];
    const located = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
    for (const b of located) {
      const m = L.circleMarker([b.lat, b.lng], {
        radius: 9,
        color: '#10251B',
        weight: 2,
        fillColor: '#16A34A',
        fillOpacity: 0.95,
      }).addTo(map).bindPopup(
        `<div class="p-1 text-xs space-y-1">
          <strong class="text-sm font-bold block text-emerald-900">Bin #${escapeHtml(b.binId)}</strong>
          <span>${escapeHtml(b.building)} · Floor ${escapeHtml(b.floor)}</span><br>
          <button data-binid="${escapeHtml(b.binId)}" class="text-xs font-bold text-emerald-700 underline mt-1 block">Find distance from here</button>
        </div>`
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.pins.forEach(m => map.removeLayer(m));
    markersRef.current.pins = [];
    for (const p of pins) {
      const color = KIND_COLOR[p.kind] || '#6b7280';
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 8,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(map).bindPopup(
        `<div class="p-1 text-xs space-y-1">
          <strong class="font-bold text-sm block" style="color:${color}">${escapeHtml(KIND_LABEL[p.kind] || p.kind)}</strong>
          ${p.note ? `<span>${escapeHtml(p.note)}</span><br>` : ''}
          ${canDropPin ? `<button data-pinresolve="${p._id}" class="text-xs font-bold underline text-emerald-700 mt-1 block">Mark Resolved ✓</button>` : ''}
        </div>`
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
    return (
      <main className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <EmptyState
          icon={BuildingIcon}
          title="Select a Campus First"
          description="Please select your campus from the top navigation bar to access the interactive bin map."
        />
      </main>
    );
  }

  if (!campus) {
    return (
      <main className="max-w-6xl mx-auto p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-eco-mint border-t-eco-emerald rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-eco-secondary">Loading campus interactive map...</p>
      </main>
    );
  }

  const located = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
  const binsNoCoords = (campus.bins || []).filter(b => b.lat == null || b.lng == null);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
            <MapPinIcon className="w-4 h-4 text-eco-emerald" />
            Interactive Campus Utility Map
          </div>
          <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
            {campus.name}
          </h1>
          <p className="text-xs sm:text-sm text-eco-secondary">
            {canDropPin
              ? 'Staff & Admin mode: Click anywhere on the map to drop a hazard pin or resolve open flags.'
              : 'Click anywhere on the map to instantly calculate distance to the nearest recycling bin.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="chip font-bold">📍 {located.length} / {(campus.bins||[]).length} Bins Plotted</span>
          <span className="chip bg-amber-50 text-amber-800 border-amber-200 font-bold">⚠️ {pins.length} Open Staff Pins</span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="card p-2 border-2 border-eco-border shadow-eco-lg rounded-3xl relative overflow-hidden">
        <div ref={mapElRef} className="w-full h-[520px] rounded-2xl overflow-hidden z-10" />
      </div>

      {/* Pending Pin Form (Staff/Admin) */}
      {canDropPin && pendingPin && (
        <form onSubmit={submitPin} className="card border-2 border-eco-forest bg-gradient-to-br from-white to-eco-mint/40 space-y-4 shadow-eco-md animate-in fade-in">
          <div className="flex items-center justify-between border-b border-eco-border pb-2">
            <h2 className="font-extrabold text-base text-eco-forest flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-eco-emerald" />
              Drop Hazard Flag Pin
            </h2>
            <span className="text-xs font-mono font-bold text-eco-secondary">
              Lat: {pendingPin.lat.toFixed(5)}, Lng: {pendingPin.lng.toFixed(5)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Flag Kind</label>
              <select className="field" value={pinForm.kind} onChange={e => setPinForm({ ...pinForm, kind: e.target.value })}>
                {KIND_VALUES.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Note (Optional)</label>
              <input
                className="field"
                placeholder="e.g. Overflowing wet waste, broken lid"
                value={pinForm.note}
                onChange={e => setPinForm({ ...pinForm, note: e.target.value })}
                maxLength={280}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="btn btn-primary px-6" disabled={busy}>
              {busy ? 'Saving Pin...' : 'Drop Pin on Map'}
            </button>
            <button type="button" className="btn" onClick={() => setPendingPin(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nearest Result Card (Students) */}
      {nearest && nearest.bin && (
        <div className="card border-2 border-eco-emerald bg-eco-mint/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-eco-md animate-in fade-in">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-eco-forest flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-eco-emerald" />
              Nearest Recycling Bin Found
            </span>
            <p className="text-lg font-extrabold text-eco-text">
              Bin #{nearest.bin.binId} · {nearest.bin.building} · Floor {nearest.bin.floor}
            </p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-eco-forest text-white text-center shrink-0">
            <p className="text-xs font-bold text-eco-lime">Distance</p>
            <p className="text-xl font-extrabold">≈ {nearest.distanceMeters} m</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="card space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-eco-secondary">Map Key & Legend</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-eco-border rounded-xl bg-white">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shadow-xs" />
            <strong className="text-eco-text">Recycling Bin Marker</strong>
          </span>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 border border-eco-border rounded-xl bg-white">
              <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ background: KIND_COLOR[k] }} />
              <span className="text-eco-text font-semibold">{label}</span>
            </span>
          ))}
        </div>
      </div>

      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
          ⚠️ {err}
        </div>
      )}

      {binsNoCoords.length > 0 && (
        <p className="text-xs text-eco-secondary text-center">
          ℹ️ {binsNoCoords.length} bins do not have lat/lng coordinates set yet. Administrators can add coordinates under Admin &gt; Edit Bins.
        </p>
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
