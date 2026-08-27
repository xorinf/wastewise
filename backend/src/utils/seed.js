import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Campus from '../models/Campus.js';

/**
 * Demo coordinates for the 3 MAIN campus bins. Set SEED_BIN_COORDS=1 to
 * stamp them at seed time so the Campus Map lights up immediately on a
 * fresh deployment.
 */
const SEED_BIN_COORDS = [
  { building: 'Block A', floor: 'Ground', binId: 'A-G-01', lat: 12.9716, lng: 77.5946 },
  { building: 'Block A', floor: '1st',    binId: 'A-1-02', lat: 12.9719, lng: 77.5950 },
  { building: 'Block B', floor: 'Ground', binId: 'B-G-01', lat: 12.9712, lng: 77.5940 },
];

async function run() {
  await connectDB();
  console.log('[seed] starting');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@wastewise.local' },
    { name: 'Admin', email: 'admin@wastewise.local', passwordHash, role: 'admin', campusIds: [] },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const staff = await User.findOneAndUpdate(
    { email: 'staff@wastewise.local' },
    { name: 'Staff Pat', email: 'staff@wastewise.local', passwordHash, role: 'staff', campusIds: [] },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const user = await User.findOneAndUpdate(
    { email: 'user@wastewise.local' },
    { name: 'Test User', email: 'user@wastewise.local', passwordHash, role: 'user', campusIds: [] },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const campus = await Campus.findOneAndUpdate(
    { code: 'MAIN' },
    {
      name: 'Main Campus',
      code: 'MAIN',
      bins: [
        { building: 'Block A', floor: 'Ground', binId: 'A-G-01' },
        { building: 'Block A', floor: '1st', binId: 'A-1-02' },
        { building: 'Block B', floor: 'Ground', binId: 'B-G-01' },
      ],
      zoneStaff: [{ building: 'Block A', floor: '', staffUserIds: [staff._id] }],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  admin.campusIds = [campus._id];
  staff.campusIds = [campus._id];
  user.campusIds = [campus._id];
  await Promise.all([admin.save(), staff.save(), user.save()]);

  // ponytail: optional flag, only when an operator sets SEED_BIN_COORDS=1.
  if (process.env.SEED_BIN_COORDS === '1') {
    let updated = 0;
    for (const want of SEED_BIN_COORDS) {
      const idx = campus.bins.findIndex(
        b => b.building === want.building && b.floor === want.floor && b.binId === want.binId
      );
      if (idx < 0) continue;
      campus.bins[idx].lat = want.lat;
      campus.bins[idx].lng = want.lng;
      updated++;
    }
    if (updated) {
      await campus.save();
      console.log(`[seed] coords: ${updated} bin(s) placed on the map`);
    }
  }

  console.log('[seed] done');
  console.log('  admin:  admin@wastewise.local  / password123');
  console.log('  staff:  staff@wastewise.local  / password123');
  console.log('  user:   user@wastewise.local   / password123');
  console.log('  campus: MAIN (Main Campus)');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
