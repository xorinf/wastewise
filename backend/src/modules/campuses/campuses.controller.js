import Campus from '../../models/Campus.js';

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
