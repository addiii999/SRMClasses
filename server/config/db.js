const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // Guard: should have been caught by startup validation, but belt-and-suspenders
  if (!uri) {
    logger.error('MONGO_URI is not defined. Cannot connect to database.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    logger.error('Exiting process due to DB connection failure.');
    process.exit(1);
  }
};

module.exports = connectDB;
