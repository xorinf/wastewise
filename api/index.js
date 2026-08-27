// Vercel serverless entry. Wraps the same Express app the local dev server
// uses, so we don't duplicate route definitions. The function connects to
// MongoDB on first request (and reuses the connection on warm starts) via
// a globalThis cache - cold starts still pay ~1 round trip the first time.

import mongoose from 'mongoose';
import app from '../backend/src/server.js';

const MONG_URI = process.env.MONGO_URI;

let connecting = null;

async function ensureConnected() {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose.connect(MONG_URI).then(() => mongoose.connection);
  }
  return connecting;
}

export default async function handler(req, res) {
  try {
    await ensureConnected();
    return app(req, res);
  } catch (e) {
    console.error('[api] handler init failed:', e);
    res.status(500).json({ error: 'Server init failed' });
  }
}

export const config = {
  api: {
    bodyParser: false, // we use multer + express.json per-route via the Express app
  },
  maxDuration: 30,
};
