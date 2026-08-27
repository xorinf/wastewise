import PickupRequest from '../../models/PickupRequest.js';
import DisposalLog from '../../models/DisposalLog.js';
import Campus from '../../models/Campus.js';

const CAMPUS_COLL = Campus.collection.name; // ponytail: Mongoose pluralizes to 'campus' — never hard-code the plural.

/** Wrap a campusFilter in a query clause, or {} if no filter. NEVER pass {} as a
 *  field value — Mongoose tries to ObjectId-cast it and throws. */
function campusClause(campusFilter) {
  if (!campusFilter || (Array.isArray(campusFilter?.$in) && campusFilter.$in.length === 0)) return {};
  return { campusId: campusFilter };
}

export async function dashboard(req, res) {
  let campusFilter = null;
  if (req.user.role === 'staff') {
    const campuses = await Campus.find({ 'zoneStaff.staffUserIds': req.user._id }, '_id');
    campusFilter = { $in: campuses.map(c => c._id) };
  } else if (req.query.campusId) {
    campusFilter = req.query.campusId;
  }
  const reqMatch = campusClause(campusFilter);

  const [byStatus, byType, byFill, recentLogs, recentReqs] = await Promise.all([
    PickupRequest.aggregate([{ $match: reqMatch }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    PickupRequest.aggregate([{ $match: reqMatch }, { $group: { _id: '$requestType', n: { $sum: 1 } } }]),
    PickupRequest.aggregate([{ $match: { ...reqMatch, status: { $in: ['pending', 'assigned'] } } }, { $group: { _id: '$fillStatus', n: { $sum: 1 } } }]),
    DisposalLog.find(reqMatch).sort({ createdAt: -1 }).limit(20),
    PickupRequest.find(reqMatch).sort({ createdAt: -1 }).limit(20),
  ]);

  return res.json({
    requestCountsByStatus: byStatus,
    requestCountsByType: byType,
    openByFillStatus: byFill,
    recentDisposals: recentLogs,
    recentRequests: recentReqs,
  });
}

export async function crossCampus(_req, res) {
  const [byCampus, byCampusStatus] = await Promise.all([
    DisposalLog.aggregate([
      { $group: { _id: '$campusId', items: { $sum: 1 }, kg: { $sum: '$estimatedKg' } } },
      { $lookup: { from: CAMPUS_COLL, localField: '_id', foreignField: '_id', as: 'campus' } },
      { $unwind: '$campus' },
      { $project: { campus: { name: '$campus.name', code: '$campus.code' }, items: 1, kg: 1 } },
    ]),
    PickupRequest.aggregate([{ $group: { _id: { campus: '$campusId', status: '$status' }, n: { $sum: 1 } } }]),
  ]);
  return res.json({ itemsByCampus: byCampus, requestsByCampusAndStatus: byCampusStatus });
}
