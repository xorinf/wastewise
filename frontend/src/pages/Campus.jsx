import { useEffect, useState } from 'react';
import { campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { BIN_KEY } from '../utils/lookups';

export default function Campus() {
  const { selectedCampusId } = useAuthStore();
  const [campus, setCampus] = useState(null);
  const [err, setErr] = useState('');

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

  // Bounds: explicit or auto-fit around the bin coords with a small padding.
  const explicit = campus.campusBounds && Object.values(campus.campusBounds).every(v => v != null);
  const padding = 0.0005;
  let bbox = explicit
    ? campus.campusBounds
    : binsWithCoords.length === 0
      ? null
      : binsWithCoords.reduce(
        (acc, b) => ({
          north: Math.max(acc.north, b.lat),
          south: Math.min(acc.south, b.lat),
          east:  Math.max(acc.east,  b.lng),
          west:  Math.min(acc.west,  b.lng),
        }),
        { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity }
      );
  if (bbox && !explicit && binsWithCoords.length) {
    bbox = { ...bbox, north: bbox.north + padding, south: bbox.south - padding, east: bbox.east + padding, west: bbox.west - padding };
  }

  // Group by building for the readable list.
  const grouped = (campus.bins || []).reduce((acc, b) => {
    (acc[b.building] ||= []).push(b); return acc;
  }, {});

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{campus.name}</h1>
        <span className="chip">{(campus.bins || []).length} bins</span>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {binsWithCoords.length === 0 && (
        <div className="card border-amber-600">
          <p className="text-sm">
            No bin coordinates yet — an admin can set them via <code>POST /api/campuses/:id/bins/:building/:floor/:binId/coords</code>.
            Until then, here is the readable list grouped by building.
          </p>
        </div>
      )}

      {bbox && binsWithCoords.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Map</h2>
            <span className="text-xs text-gray-500">inline SVG · {binsWithCoords.length} of {(campus.bins||[]).length} bins located</span>
          </div>
          <BinMap bins={binsWithCoords} bbox={bbox} />
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
                {list.sort((a,b) => a.floor.localeCompare(b.floor) || a.binId.localeCompare(b.binId)).map(b => (
                  <li key={`${b.building}-${b.floor}-${b.binId}`} className="py-2 flex items-center justify-between">
                    <span>Floor {b.floor} · Bin {b.binId}</span>
                    <span className="text-xs text-gray-500">
                      {b.lat != null && b.lng != null
                        ? `${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}`
                        : 'no coords'}
                    </span>
                  </li>
                ))}
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

function BinMap({ bins, bbox }) {
  // Project (lat,lng) -> SVG (x,y). lng is horizontal, lat is vertical (flipped).
  const project = (lat, lng) => {
    const x = ((lng - bbox.west) / (bbox.east - bbox.west)) * VIEWBOX_W;
    const y = ((bbox.north - lat) / (bbox.north - bbox.south)) * VIEWBOX_H;
    return [x, y];
  };

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="w-full h-auto border border-gray-200 rounded-md bg-gray-50" role="img" aria-label="Campus bin map">
      {/* faint grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#grid)" />

      {bins.map(b => {
        const [x, y] = project(b.lat, b.lng);
        // ponytail: all bins default to "general" black until something tells us otherwise.
        // A future enhancement: pull the latest disposal at this bin to color by category.
        const color = '#111827';
        return (
          <g key={`${b.building}-${b.floor}-${b.binId}`}>
            <circle cx={x} cy={y} r="9" fill={color} stroke="#fff" strokeWidth="2" />
            <text x={x} y={y - 14} textAnchor="middle" fontSize="11" fill="#111827">{b.binId}</text>
            <text x={x} y={y + 22} textAnchor="middle" fontSize="10" fill="#6b7280">{b.building} · {b.floor}</text>
          </g>
        );
      })}
    </svg>
  );
}
