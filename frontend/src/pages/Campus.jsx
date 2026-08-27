import { useEffect, useRef, useState } from 'react';
import { campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { BIN_KEY } from '../utils/lookups';

export default function Campus() {
  const { selectedCampusId } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [err, setErr] = useState('');
  const [focusedBinId, setFocusedBinId] = useState(null);
  const mapCardRef = useRef(null);

  useEffect(() => {
    if (!selectedCampusId) return;
    campusApi.get(selectedCampusId).then(d => setCampus(d.campus)).catch(e => setErr(e.message));
  }, [selectedCampusId]);

  if (!selectedCampusId) {
    return <main className="max-w-2xl mx-auto p-8"><p className="text-gray-700">Pick a campus first (top right).</p></main>;
  }
  if (!campus) {
    return <main className="max-w-4xl mx-auto p-8"><p className="text-gray-600">Loading…</p></main>;
  }

  const binsWithCoords = (campus.bins || []).filter(b => b.lat != null && b.lng != null);
  const binsNoCoords = (campus.bins || []).filter(b => b.lat == null || b.lng == null);

  // Bounds: explicit or auto-fit. When a single bin is focused, recenter the
  // viewBox on it so the highlight can't be cut off at the edge.
  const explicit = campus.campusBounds && Object.values(campus.campusBounds).every(v => v != null);
  const padding = 0.0005;
  let bbox;
  if (explicit) bbox = campus.campusBounds;
  else if (binsWithCoords.length === 0) bbox = null;
  else bbox = binsWithCoords.reduce(
    (acc, b) => ({
      north: Math.max(acc.north, b.lat),
      south: Math.min(acc.south, b.lat),
      east:  Math.max(acc.east,  b.lng),
      west:  Math.min(acc.west,  b.lng),
    }),
    { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity }
  );

  // Center on the focused bin (or fall back to the centroid of all dots).
  let centered = bbox;
  if (binsWithCoords.length > 0) {
    if (focusedBinId) {
      const f = binsWithCoords.find(b => b.binId === focusedBinId);
      if (f) {
        const span = (bbox.east - bbox.west) || 0.001;
        centered = {
          north: f.lat + span * 0.05,
          south: f.lat - span * 0.05,
          east:  f.lng + span * 0.05,
          west:  f.lng - span * 0.05,
        };
      }
    } else if (!explicit) {
      centered = { ...bbox, north: bbox.north + padding, south: bbox.south - padding, east: bbox.east + padding, west: bbox.west - padding };
    }
  }

  const grouped = (campus.bins || []).reduce((acc, b) => {
    (acc[b.building] ||= []).push(b); return acc;
  }, {});

  const focusedBin = focusedBinId ? (campus.bins || []).find(b => b.binId === focusedBinId) : null;

  const focusBin = (binId, withCoords) => {
    setFocusedBinId(binId);
    // Scroll the map into view only when the bin can actually be plotted.
    if (withCoords && mapCardRef.current) {
      mapCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{campus.name}</h1>
        <span className="chip">{(campus.bins || []).length} bins</span>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {focusedBin && (
        <div className="card border-gray-900 border-2 flex items-start justify-between gap-3">
          <div className="text-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Focused</p>
            <p className="font-medium">{focusedBin.binId} · {focusedBin.building} · floor {focusedBin.floor}</p>
            <p className="text-gray-600 text-xs mt-1">
              {focusedBin.lat != null && focusedBin.lng != null
                ? <>lat {focusedBin.lat.toFixed(5)}, lng {focusedBin.lng.toFixed(5)}</>
                : 'no coordinates yet'}
            </p>
          </div>
          <button className="btn !text-xs !py-1 !px-2" onClick={() => setFocusedBinId(null)}>Clear</button>
        </div>
      )}

      {binsWithCoords.length === 0 && (
        <div className="card border-amber-600">
          <p className="text-sm">
            No bin coordinates yet — an admin can set them via <code>POST /api/campuses/:id/bins/:building/:floor/:binId/coords</code>.
            Until then, here is the readable list grouped by building.
          </p>
        </div>
      )}

      {binsWithCoords.length > 0 && centered && (
        <div className="card" ref={mapCardRef}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Map</h2>
            <span className="text-xs text-gray-500">
              inline SVG · {binsWithCoords.length} of {(campus.bins||[]).length} bins located
              {focusedBin ? ` · focused on ${focusedBin.binId}` : ''}
            </span>
          </div>
          <BinMap bins={binsWithCoords} bbox={centered} focusedBinId={focusedBinId} onClickBin={(id) => setFocusedBinId(id)} />
          <div className="flex flex-wrap gap-2 text-xs mt-3">
            {BIN_KEY.map(k => (
              <span key={k.category} className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: k.color }} />
                <strong className="text-gray-700">{k.textColor}</strong>
                <span className="text-gray-500">· {k.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">All bins · by building</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(grouped).map(([building, list]) => (
            <div key={building}>
              <p className="font-medium mb-1">{building}</p>
              <ul className="text-sm divide-y">
                {list.sort((a,b) => a.floor.localeCompare(b.floor) || a.binId.localeCompare(b.binId)).map(b => {
                  const hasCoords = b.lat != null && b.lng != null;
                  const isFocused = focusedBinId === b.binId;
                  return (
                    <li key={`${b.building}-${b.floor}-${b.binId}`}>
                      <button
                        type="button"
                        onClick={() => focusBin(b.binId, hasCoords)}
                        className={`w-full py-2 flex items-center justify-between text-left rounded px-2 -mx-2 ${hasCoords ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} ${isFocused ? 'bg-gray-100 border border-gray-900' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${hasCoords ? 'bg-gray-900' : 'bg-gray-300'}`} />
                          <span>Floor {b.floor} · Bin {b.binId}</span>
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {hasCoords ? `${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}` : 'no coords'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {binsNoCoords.length > 0 && (
        <p className="text-xs text-gray-500">{binsNoCoords.length} bins without coordinates — they will appear on the map once added.</p>
      )}
    </main>
  );
}

const VIEWBOX_W = 800;
const VIEWBOX_H = 500;

function BinMap({ bins, bbox, focusedBinId, onClickBin }) {
  const project = (lat, lng) => {
    const x = ((lng - bbox.west) / (bbox.east - bbox.west)) * VIEWBOX_W;
    const y = ((bbox.north - lat) / (bbox.north - bbox.south)) * VIEWBOX_H;
    return [x, y];
  };

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="w-full h-auto border border-gray-200 rounded-md bg-gray-50" role="img" aria-label="Campus bin map">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#grid)" />

      {bins.map(b => {
        const [x, y] = project(b.lat, b.lng);
        const isFocused = focusedBinId === b.binId;
        return (
          <g
            key={`${b.building}-${b.floor}-${b.binId}`}
            onClick={() => onClickBin(b.binId)}
            style={{ cursor: 'pointer' }}
          >
            {isFocused && (
              <circle cx={x} cy={y} r="18" fill="none" stroke="#111827" strokeWidth="2" strokeDasharray="4 3" />
            )}
            <circle
              cx={x} cy={y}
              r={isFocused ? 12 : 9}
              fill={isFocused ? '#111827' : '#4b5563'}
              stroke="#fff" strokeWidth="2"
            />
            <text x={x} y={y - (isFocused ? 24 : 14)} textAnchor="middle" fontSize={isFocused ? '13' : '11'} fontWeight={isFocused ? '600' : '400'} fill="#111827">{b.binId}</text>
            <text x={x} y={y + (isFocused ? 28 : 22)} textAnchor="middle" fontSize="10" fill="#6b7280">{b.building} · {b.floor}</text>
          </g>
        );
      })}
    </svg>
  );
}
