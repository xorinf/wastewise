import Campus from '../../models/Campus.js';

/** Haversine distance, meters. */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const s = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * GET /api/campuses/:id/nearest-bin?lat=&lng= (lat/lng optional).
 * Returns the bin closest to (lat,lng), or to the campus centroid if no
 * point is supplied. Falls back to the first located bin if a centroid
 * can't be computed (only one bin with coords).
 */
export async function nearestBin(req, res) {
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const located = (doc.bins || []).filter(b => b.lat != null && b.lng != null);
  if (located.length === 0) return res.json({ bin: null });

  let origin;
  if (req.query.lat != null && req.query.lng != null) {
    origin = { lat: Number(req.query.lat), lng: Number(req.query.lng) };
  } else {
    // centroid of all located bins
    const sum = located.reduce((acc, b) => ({ lat: acc.lat + b.lat, lng: acc.lng + b.lng }), { lat: 0, lng: 0 });
    origin = { lat: sum.lat / located.length, lng: sum.lng / located.length };
  }

  let best = located[0], bestD = Infinity;
  for (const b of located) {
    const d = distanceMeters(origin, b);
    if (d < bestD) { best = b; bestD = d; }
  }
  return res.json({ bin: best, distanceMeters: Math.round(bestD) });
}

export async function list(_req, res) {
  const docs = await Campus.find({}, 'name code');
  return res.json({ campuses: docs });
}

export async function create(req, res) {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'name and code required' });
  const doc = await Campus.create({ name, code: code.toUpperCase() });
  return res.status(201).json({ campus: doc });
}

export async function getOne(req, res) {
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json({ campus: doc });
}

export async function addBin(req, res) {
  const { building, floor, binId } = req.body || {};
  if (!building || !floor || !binId) return res.status(400).json({ error: 'building, floor, binId required' });
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.bins.push({ building, floor, binId });
  await doc.save();
  return res.json({ campus: doc });
}

/** Set coords for a specific bin (matched by building+floor+binId) in one shot. */
export async function setBinCoords(req, res) {
  const { lat, lng } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat, lng (numbers) required' });
  }
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const idx = doc.bins.findIndex(
    b => b.building === req.params.building && b.floor === req.params.floor && b.binId === req.params.binId
  );
  if (idx < 0) return res.status(404).json({ error: 'Bin not found at that location' });
  doc.bins[idx].lat = lat;
  doc.bins[idx].lng = lng;
  await doc.save();
  return res.json({ campus: doc });
}

/** Set the campus map viewBox (north/south/east/west in decimal degrees). */
export async function setCampusBounds(req, res) {
  const { north, south, east, west } = req.body || {};
  if ([north, south, east, west].some(v => typeof v !== 'number')) {
    return res.status(400).json({ error: 'north, south, east, west (numbers) required' });
  }
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.campusBounds = { north, south, east, west };
  await doc.save();
  return res.json({ campus: doc });
}

export async function mapZoneStaff(req, res) {
  const { building, floor = '', staffUserIds = [] } = req.body || {};
  if (!building || !Array.isArray(staffUserIds)) {
    return res.status(400).json({ error: 'building and staffUserIds[] required' });
  }
  const doc = await Campus.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.zoneStaff.push({ building, floor, staffUserIds });
  await doc.save();
  return res.json({ campus: doc });
}
