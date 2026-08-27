import Pin from '../../models/Pin.js';
import Campus from '../../models/Campus.js';

/** Haversine distance in meters. */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const s = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function listByCampus(req, res) {
  const { campusId, status } = req.query;
  if (!campusId) return res.status(400).json({ error: 'campusId required' });
  const q = { campusId };
  if (status) q.status = status;
  const pins = await Pin.find(q).sort({ createdAt: -1 }).limit(500);
  return res.json({ pins });
}

export async function create(req, res) {
  const { campusId, lat, lng, kind, note = '' } = req.body || {};
  if (!campusId || typeof lat !== 'number' || typeof lng !== 'number' || !kind) {
    return res.status(400).json({ error: 'campusId, lat, lng, kind required' });
  }
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only staff or admin can drop pins' });
  }
  const campus = await Campus.findById(campusId);
  if (!campus) return res.status(404).json({ error: 'Campus not found' });

  const pin = await Pin.create({
    campusId, lat, lng, kind, note,
    createdBy: req.user._id,
  });
  return res.status(201).json({ pin });
}

export async function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  const pin = await Pin.findById(req.params.id);
  if (!pin) return res.status(404).json({ error: 'Not found' });
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  pin.status = status;
  if (status === 'resolved') pin.resolvedAt = new Date();
  await pin.save();
  return res.json({ pin });
}

/** GET /api/pins/nearest?campusId=&lat=&lng= */
export async function nearestPin(req, res) {
  const { campusId, lat, lng } = req.query;
  if (!campusId || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'campusId, lat, lng required' });
  }
  const origin = { lat: Number(lat), lng: Number(lng) };
  const pins = await Pin.find({ campusId, status: 'open' });
  if (!pins.length) return res.json({ pin: null });
  pins.sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b));
  return res.json({ pin: pins[0], distanceMeters: distanceMeters(origin, pins[0]) });
}
