const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simplifly')
  .then(() => {
    console.log('MongoDB connected');
    setSuperadmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function setSuperadmin() {
  try {
    const username = process.argv[2];
    
    if (!username) {
      console.error('Usage: node setSuperadmin.js <username>');
      process.exit(1);
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User "${username}" not found`);
      process.exit(1);
    }

    user.role = 'superadmin';
    await user.save();
    
    console.log(`✓ User "${username}" has been set as superadmin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}
