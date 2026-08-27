import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';

import authRoutes from './modules/auth/auth.routes.js';
import itemIdRoutes from './modules/itemId/itemId.routes.js';
import pickupRoutes from './modules/pickupRequests/pickupRequests.routes.js';
import campusRoutes from './modules/campuses/campuses.routes.js';
import staffRoutes from './modules/staffDashboard/staffDashboard.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemIdRoutes);
app.use('/api/requests', pickupRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/staff', staffRoutes);

app.use((err, _req, res, _next) => {
  console.error('[err]', err.message);
  // Mongoose duplicate key -> 409, validation -> 400
  let status = err.status || err.statusCode || 500;
  if (err.code === 11000) status = 409;
  if (err.name === 'ValidationError') status = 400;
  res.status(status).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`[server] listening on :${PORT}`)))
    .catch(err => {
      console.error('[boot] failed:', err.message);
      process.exit(1);
    });
}

export default app;
