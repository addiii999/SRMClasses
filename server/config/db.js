const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('🔄 Attempting MongoDB connection...');
  console.log('URI starts with:', uri ? uri.substring(0, 40) + '...' : 'NOT SET');
  
  try {
    const conn = await mongoose.connect(uri, { 
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`❌ Full Error:`, error);
    console.log('⚠️ Server will continue running. Database features will not work.');
    // Do NOT exit - let the server stay alive for debugging
  }
};

module.exports = connectDB;

