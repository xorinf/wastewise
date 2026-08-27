import DisposalLog from '../../models/DisposalLog.js';
import User from '../../models/User.js';
import { uploadImage } from '../../config/cloudinary.js';
import { binFor, kgFor, QUICK_SELECT } from '../../utils/lookup.js';

const POINTS_PER_LOG = 10;

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const CONFIDENCE_THRESHOLD = 0.6;

// System prompt locks Gemini into our 4-category schema and asks for JSON-only output.
const GEMINI_PROMPT = `You classify waste items for a campus app. Look at the image and return strict JSON only.
Schema: {"name": "<short item name in English>", "category": "wet_organic|dry_recyclable|hazardous_ewaste|reject_other", "confidence": <0..1>}.
Category rules:
- wet_organic: food scraps, fruit/veg peels, cooked food, tea bags, coffee grounds.
- dry_recyclable: clean plastic, paper, cardboard, metal cans, glass.
- hazardous_ewaste: batteries, bulbs, paints, chemicals, electronics.
- reject_other: multi-layer packaging, used tissue, diapers, anything contaminated or non-recyclable.
If unsure, lower confidence. Reply with JSON object only, no markdown, no commentary.`;

/**
 * Vision call dispatcher. Returns { name, category, confidence } or null.
 * Provider selected via VISION_PROVIDER=gemini in .env; default no-op so the
 * /identify endpoint can fall back to the quick-select path.
 */
async function callVisionModel({ buffer, mimetype, url }) {
  const provider = process.env.VISION_PROVIDER;
  if (provider === 'gemini') return callGemini(buffer, mimetype);
  if (provider === 'generic') return callGeneric(url);
  return null;
}

async function callGemini(buffer, mimetype = 'image/jpeg') {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  if (!key) return null;

  const endpoint = `${GEMINI_ENDPOINT}/${model}:generateContent`;
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: GEMINI_PROMPT },
            { inline_data: { mime_type: mimetype, data: buffer.toString('base64') } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });
    if (!r.ok) {
      console.warn('[gemini] non-ok:', r.status, await r.text().catch(() => ''));
      return null;
    }
    const json = await r.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) console.warn('[gemini] empty text, finish:', json?.candidates?.[0]?.finishReason);
    return parseGeminiReply(text);
  } catch {
    return null;
  }
}

async function callGeneric(url) {
  const endpoint = process.env.VISION_API_URL;
  const key = process.env.VISION_API_KEY;
  if (!endpoint || !key) return null;
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: url }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return { name: j.name, category: j.category, confidence: Number(j.confidence ?? 0) };
  } catch {
    return null;
  }
}

/** Pull { name, category, confidence } from the model text, even if truncated. */
function parseGeminiReply(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const blob = fenced ? fenced[1] : text;

  const name = (blob.match(/"name"\s*:\s*"([^"]+)"/) || [])[1]?.trim();
  const category = (blob.match(/"category"\s*:\s*"([^"]+)"/) || [])[1];
  const confStr = (blob.match(/"confidence"\s*:\s*([0-9.]+)/) || [])[1];
  const confidence = Number.isFinite(Number(confStr)) ? Number(confStr) : 0;

  if (!name || !category) return null;
  return { name, category, confidence };
}

export async function quickSelect(_req, res) {
  return res.json({ items: QUICK_SELECT });
}

export async function identify(req, res) {
  const { campusId } = req.body || {};
  if (!campusId) return res.status(400).json({ error: 'campusId required' });
  if (!req.file) return res.status(400).json({ error: 'image file required (multipart field "image")' });

  const { url } = await uploadImage(req.file);
  const vision = await callVisionModel({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    url,
  });

  if (!vision || typeof vision.confidence !== 'number' || vision.confidence < CONFIDENCE_THRESHOLD) {
    // ponytail: confidence 0.6 picked by gut; tune against real Gemini precision.
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

  // Insert as 'pending' - points + itemsLogged only credit when the user
  // confirms the disposal via /verify/:id. Idempotent: the verify step
  // does the math, so we never double-count at log time.
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
    status: 'pending',
  });
  return res.status(201).json({ log, points: 0 });
}

/** POST /api/items/verify/:id
 *  Marks a pending DisposalLog as verified, then increments user.points and
 *  user.itemsLogged. Returns the updated log + the points awarded. */
export async function verifyLog(req, res) {
  const log = await DisposalLog.findById(req.params.id);
  if (!log) return res.status(404).json({ error: 'Not found' });
  if (log.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Cannot verify another user\'s log' });
  }
  if (log.status === 'verified') {
    return res.json({ log, points: 0, alreadyVerified: true });
  }
  log.status = 'verified';
  log.verifiedAt = new Date();
  await log.save();
  await User.updateOne(
    { _id: req.user._id },
    { $inc: { points: log.pointsEarned, itemsLogged: 1 } }
  );
  return res.json({ log, points: log.pointsEarned, alreadyVerified: false });
}

export async function myHistory(req, res) {
  const logs = await DisposalLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  return res.json({ logs });
}

export async function myStats(req, res) {
  // Only verified logs count toward the impact stat - matches the user's
  // "in the bin yet" workflow: claimed items don't move the bar.
  const agg = await DisposalLog.aggregate([
    { $match: { userId: req.user._id, status: 'verified' } },
    { $group: { _id: null, total: { $sum: 1 }, kg: { $sum: '$estimatedKg' } } },
  ]);
  const { total = 0, kg = 0 } = agg[0] || {};
  return res.json({ itemsLogged: total, estimatedKgDiverted: kg, points: req.user.points });
}
