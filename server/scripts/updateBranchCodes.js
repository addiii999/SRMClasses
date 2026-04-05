const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Branch = require('../models/Branch');

const update = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('⏳ Updating branch codes...');

    // Update Ravi Steel
    await Branch.findOneAndUpdate(
      { branchCode: 'RAVI' },
      { googleMapsLink: 'https://maps.app.goo.gl/TFpjRggpozuA5TDPA' }
    );
    console.log('✅ Updated Ravi Steel Google Maps link');

    // Update Mandar
    await Branch.findOneAndUpdate(
      { branchCode: 'MANDAR' },
      { 
        address: 'Mandar (Near Mission Hospital), Ranchi, Jharkhand 835214',
        googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=23.464467,85.080045' 
      }
    );
    console.log('✅ Updated Mandar branch location and link');

    console.log('🎉 Branch codes updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating branch codes:', err);
    process.exit(1);
  }
};

update();
