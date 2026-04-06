const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fix() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const col = db.collection('demobookings');

  const maps = [
    { old: 'Confirmed', new: 'visited' },
    { old: 'CONFIRMED', new: 'visited' },
    { old: 'Pending', new: 'pending' },
    { old: 'PENDING', new: 'pending' },
    { old: 'Completed', new: 'converted' },
    { old: 'COMPLETED', new: 'converted' },
    { old: 'Cancelled', new: 'rejected' },
    { old: 'CANCELLED', new: 'rejected' }
  ];

  for (const m of maps) {
    const res = await col.updateMany({ status: m.old }, { $set: { status: m.new } });
    if (res.modifiedCount > 0) {
      console.log(`✅ Fixed ${res.modifiedCount} records: ${m.old} -> ${m.new}`);
    }
  }

  const distinct = await col.distinct('status');
  console.log('Final distinct statuses in DB:', distinct);

  await mongoose.disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
