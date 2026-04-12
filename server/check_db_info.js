require('dotenv').config();
const mongoose = require('mongoose');

async function checkDbInfo() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to Database: ${mongoose.connection.name}`);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections in this DB:');
  collections.forEach(c => console.log(` - ${c.name}`));
  
  const adminCount = await mongoose.connection.db.collection('admins').countDocuments();
  console.log(`Documents in 'admins' collection: ${adminCount}`);

  await mongoose.disconnect();
}

checkDbInfo();
