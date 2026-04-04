require('dotenv').config();
const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: String,
  priorityOrder: Number
});

const Faculty = mongoose.model('Faculty', facultySchema);

const priorityMap = {
  'Mr. Ranjan Kumar Soni': 1,
  'Mr. Raghuwendra Kumar Soni': 2,
  'Mr. Yuvraj Kumar': 3
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const [name, priority] of Object.entries(priorityMap)) {
      const result = await Faculty.updateOne(
        { name: name },
        { $set: { priorityOrder: priority, isActive: true } }
      );
      if (result.matchedCount > 0) {
        console.log(`Updated ${name} with priority ${priority}`);
      } else {
        console.warn(`Faculty ${name} not found!`);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
