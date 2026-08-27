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
