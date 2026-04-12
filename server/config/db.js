const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // Guard: should have been caught by startup validation, but belt-and-suspenders
  if (!uri) {
    console.error('❌ MONGO_URI is not defined. Cannot connect to database.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('Production mode: exiting process due to DB connection failure.');
      process.exit(1);
    } else {
      console.warn('⚠️ Development mode: server will continue without DB. Some features will not work.');
    }
  }
};

module.exports = connectDB;
