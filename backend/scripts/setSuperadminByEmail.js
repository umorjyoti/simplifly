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
    const email = process.argv[2];
    
    if (!email) {
      console.error('Usage: node setSuperadminByEmail.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`User with email "${email}" not found`);
      process.exit(1);
    }

    user.role = 'superadmin';
    await user.save();
    
    console.log(`✓ User "${user.name}" (${user.email}) has been set as superadmin`);
    console.log(`  User ID: ${user._id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}
