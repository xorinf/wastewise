import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ponytail: keep one default-icon reset, scoped to module load.
try {
  const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
  const icon2xUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
  const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl: icon2xUrl, shadowUrl });
} catch (e) {
  console.warn('[leaflet] default-icon assets failed:', e?.message);
}

const VIEWBOX_W = 800;
const VIEWBOX_H = 500;

/**
 * Inline-SVG Leaflet map. Reusable across /campus and /admin.
 *
 * mode='view':  show all bins + pins, click an empty spot = onSelect(latlng).
 * mode='pick':  single draggable marker; onMove fires while dragging or on
 *               programmatic moves (so the form's lat/lng inputs update).
 */
export default function CampusMap({
  bins = [],
  pins = [],
  bbox = null,
  dragMarker = null, // { lat, lng }
  onMove = () => {},
  onSelect = () => {},
  height = 360,
}) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const binLayerRef = useRef(null);
  const pinLayerRef = useRef(null);
  const dragMarkerRef = useRef(null);

  // Mount once.
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const center = centerFromBbox(bbox) ?? [12.9716, 77.5946];
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(center, 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);
    mapRef.current = map;

    const raf = requestAnimationFrame(() => {
      try { map.invalidateSize(); } catch {}
    });
    map.on('click', (e) => onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.on('error', (e) => console.error('[leaflet]', e));

    binLayerRef.current = L.layerGroup().addTo(map);
    pinLayerRef.current = L.layerGroup().addTo(map);
    return () => {
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bins
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const layer = binLayerRef.current; if (!layer) return;
    layer.clearLayers();
    if (!bins.length) return;
    const color = '#4b5563';
    for (const b of bins) {
      if (b.lat == null || b.lng == null) continue;
      const m = L.circleMarker([b.lat, b.lng], {
        radius: 9, color: '#111827', weight: 2, fillColor: color, fillOpacity: 0.9,
      }).bindPopup(
        `<div class="text-sm"><strong>${escapeHtml(b.binId)}</strong><br>${escapeHtml(b.building)} · floor ${escapeHtml(b.floor)}</div>`
      );
      layer.addLayer(m);
    }
    // Fit bounds to all bins + the pick marker (if any).
    const points = bins.filter(b => b.lat != null).map(b => [b.lat, b.lng]);
    if (dragMarker) points.push([dragMarker.lat, dragMarker.lng]);
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map(p => L.latLng(...p))).pad(0.3));
  }, [bins, dragMarker]);

  // Pins
  useEffect(() => {
    const layer = pinLayerRef.current; if (!layer) return;
    layer.clearLayers();
    for (const p of pins) {
      const color = {
        hazard: '#dc2626', broken_bin: '#f59e0b', no_signage: '#7c3aed',
        request_supplies: '#2563eb', other: '#6b7280',
      }[p.kind] || '#6b7280';
      L.circleMarker([p.lat, p.lng], { radius: 7, color, weight: 2, fillColor: color, fillOpacity: 0.85 })
        .bindPopup(`<div class="text-sm"><strong>${escapeHtml(p.kind)}</strong>${p.note ? `<br>${escapeHtml(p.note)}` : ''}</div>`)
        .addTo(layer);
    }
  }, [pins]);

  // Draggable pick marker.
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (dragMarkerRef.current) { map.removeLayer(dragMarkerRef.current); dragMarkerRef.current = null; }
    if (!dragMarker || dragMarker.lat == null || dragMarker.lng == null) return;
    const m = L.marker([dragMarker.lat, dragMarker.lng], { draggable: true }).addTo(map);
    m.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      onMove({ lat, lng });
    });
    dragMarkerRef.current = m;
  }, [dragMarker?.lat, dragMarker?.lng, onMove]);

  // Honor explicit bbox when supplied.
  useEffect(() => {
    const map = mapRef.current; if (!map || !bbox) return;
    const points = [[bbox.north, bbox.east], [bbox.south, bbox.west]];
    map.fitBounds(L.latLngBounds(points.map(p => L.latLng(...p))));
  }, [bbox?.north, bbox?.south, bbox?.east, bbox?.west]);

  // ponytail: hardcoded style is the only way to guarantee the map has a
  // height - Tailwind class get purged, see Campus.jsx change.
  return <div ref={mapElRef} style={{ height, width: '100%' }} className="rounded-md border border-gray-300 overflow-hidden bg-gray-50" />;
}

function centerFromBbox(b) {
  if (!b) return null;
  return [(b.north + b.south) / 2, (b.east + b.west) / 2];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
