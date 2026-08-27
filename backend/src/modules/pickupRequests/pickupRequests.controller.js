import PickupRequest from '../../models/PickupRequest.js';
import Campus from '../../models/Campus.js';

/**
 * Static zone->staff mapping: pick first staff in (building, floor) zone,
 * then by building, then any zone on the campus.
 */
async function assignStaff(campus, building, floor) {
  const exact = campus.zoneStaff.find(
    z => z.building === building && (z.floor === floor || z.floor === '' || z.floor === '*')
  );
  if (exact && exact.staffUserIds.length > 0) return exact.staffUserIds[0];

  const anyMatch = campus.zoneStaff.find(z => z.building === building);
  if (anyMatch && anyMatch.staffUserIds.length > 0) return anyMatch.staffUserIds[0];

  for (const z of campus.zoneStaff) {
    if (z.staffUserIds.length > 0) return z.staffUserIds[0];
  }
  return null;
}

async function canStaffSeeRequest(staff, doc) {
  const campus = await Campus.findById(doc.campusId);
  if (!campus) return false;
  return campus.zoneStaff.some(z => z.staffUserIds.some(id => id.equals(staff._id)));
}

export async function create(req, res) {
  const {
    campusId, building, floor, binId,
    fillStatus, requestType, quantity, note = '',
  } = req.body || {};

  if (!campusId || !building || !floor || !binId || !fillStatus || !requestType || !quantity) {
    return res.status(400).json({ error: 'campusId, building, floor, binId, fillStatus, requestType, quantity required' });
  }

  const campus = await Campus.findById(campusId);
  if (!campus) return res.status(404).json({ error: 'Campus not found' });

  // ponytail: bin existence check skipped - PRD lets user pick freely.

  const assignedTo = await assignStaff(campus, building, floor);

  const doc = await PickupRequest.create({
    raisedBy: req.user._id,
    campusId,
    building,
    floor,
    binId,
    fillStatus,
    requestType,
    quantity,
    note,
    assignedTo,
    status: assignedTo ? 'assigned' : 'pending',
  });
  return res.status(201).json({ request: doc });
}

export async function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!['pending', 'assigned', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  const doc = await PickupRequest.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  if (req.user.role === 'staff') {
    const ok = doc.assignedTo?.equals(req.user._id) || (await canStaffSeeRequest(req.user, doc));
    if (!ok) return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  doc.status = status;
  if (status === 'resolved') doc.resolvedAt = new Date();
  await doc.save();
  return res.json({ request: doc });
}

export async function listOpen(req, res) {
  const q = {};
  if (req.user.role === 'user') {
    q.raisedBy = req.user._id;
  } else if (req.user.role === 'staff') {
    const campuses = await Campus.find({ 'zoneStaff.staffUserIds': req.user._id }, '_id');
    q.campusId = { $in: campuses.map(c => c._id) };
    q.status = { $in: ['pending', 'assigned'] };
  }
  if (req.query.campusId) q.campusId = req.query.campusId;
  const docs = await PickupRequest.find(q).sort({ createdAt: -1 }).limit(500);
  return res.json({ requests: docs });
}

export async function getOne(req, res) {
  const doc = await PickupRequest.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json({ request: doc });
}
