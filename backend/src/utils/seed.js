import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Campus from '../models/Campus.js';

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
