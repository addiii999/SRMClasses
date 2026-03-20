const mongoose = require('mongoose');

const uri1 = "mongodb://srmadmin:Aditya111@ac-ihydthu-shard-00-00.c8run2.mongodb.net:27017,ac-ihydthu-shard-00-01.c8run2.mongodb.net:27017,ac-ihydthu-shard-00-02.c8run2.mongodb.net:27017/srmclasses?ssl=true&replicaSet=atlas-1290n5-shard-0&authSource=admin&appName=Cluster0";
const uri2 = "mongodb://srmadmin:SRMClasses123!@ac-ihydthu-shard-00-00.c8run2.mongodb.net:27017,ac-ihydthu-shard-00-01.c8run2.mongodb.net:27017,ac-ihydthu-shard-00-02.c8run2.mongodb.net:27017/srmclasses?ssl=true&replicaSet=atlas-1290n5-shard-0&authSource=admin&appName=Cluster0";

const testConnection = async (uri, name) => {
  console.log(`Testing ${name}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ SUCCESS: ${name} connected!`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${name} (${err.message})`);
    return false;
  }
};

const run = async () => {
  const result1 = await testConnection(uri1, "Aditya111");
  const result2 = await testConnection(uri2, "SRMClasses123!");
  if (!result1 && !result2) {
    console.log("\nDono hi kaam nahi kar rahe. Shayad cluster ID galat hai ya net block hai.");
  }
  process.exit(0);
};

run();
