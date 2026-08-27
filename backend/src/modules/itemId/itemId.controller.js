import DisposalLog from '../../models/DisposalLog.js';
import User from '../../models/User.js';
import { uploadImage } from '../../config/cloudinary.js';
import { binFor, kgFor, QUICK_SELECT } from '../../utils/lookup.js';

const POINTS_PER_LOG = 10;

/**
 * Vision call stub. PRD says one external call, input=image, output=name+category.
 * Replace the body when VISION_API_URL is set.
 */
async function callVisionModel(imageUrl) {
  const url = process.env.VISION_API_URL;
  if (!url || !process.env.VISION_API_KEY) return null;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.VISION_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrl }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function quickSelect(_req, res) {
  return res.json({ items: QUICK_SELECT });
}

export async function identify(req, res) {
  const { campusId } = req.body || {};
  if (!campusId) return res.status(400).json({ error: 'campusId required' });
  if (!req.file) return res.status(400).json({ error: 'image file required (multipart field "image")' });

  const { url, stub } = await uploadImage(req.file);
  const vision = await callVisionModel(stub ? null : url);

  if (!vision || typeof vision.confidence !== 'number' || vision.confidence < 0.6) {
    // ponytail: confidence threshold 0.6 picked by gut; tune against real model precision.
    return res.json({
      lowConfidence: true,
      imageUrl: url,
      suggestions: QUICK_SELECT,
      message: 'Vision model unsure - please pick an item from the quick-select grid.',
    });
  }

  const bin = binFor(vision.category);
  if (!bin) return res.status(400).json({ error: 'Vision returned unknown category' });

  return res.json({
    lowConfidence: false,
    itemName: vision.name,
    category: vision.category,
    bin,
    points: POINTS_PER_LOG,
    estimatedKg: kgFor(vision.category),
    imageUrl: url,
  });
}

export async function logDisposal(req, res) {
  const { itemName, category, campusId, source = 'quick_select', imageUrl = '' } = req.body || {};
  if (!itemName || !category || !campusId) {
    return res.status(400).json({ error: 'itemName, category, campusId required' });
  }
  const bin = binFor(category);
  if (!bin) return res.status(400).json({ error: 'Unknown category' });

  const log = await DisposalLog.create({
    userId: req.user._id,
    campusId,
    itemName,
    category,
    binColor: bin.color,
    pointsEarned: POINTS_PER_LOG,
    estimatedKg: kgFor(category),
    imageUrl,
    source,
  });
  await User.updateOne({ _id: req.user._id }, { $inc: { points: POINTS_PER_LOG, itemsLogged: 1 } });
  return res.status(201).json({ log, points: POINTS_PER_LOG });
}

export async function myHistory(req, res) {
  const logs = await DisposalLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  return res.json({ logs });
}

export async function myStats(req, res) {
  const agg = await DisposalLog.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: null, total: { $sum: 1 }, kg: { $sum: '$estimatedKg' } } },
  ]);
  const { total = 0, kg = 0 } = agg[0] || {};
  return res.json({ itemsLogged: total, estimatedKgDiverted: kg, points: req.user.points });
}
