const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
};

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simplifly', mongooseOptions);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('workspaceinvites');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the inviteToken index if it exists
    try {
      await collection.dropIndex('inviteToken_1');
      console.log('Dropped inviteToken_1 index');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('inviteToken_1 index does not exist, skipping drop');
      } else {
        throw error;
      }
    }

    // Also try dropping by the unique index name pattern
    try {
      await collection.dropIndex({ inviteToken: 1 });
      console.log('Dropped inviteToken index by specification');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('inviteToken index does not exist, skipping drop');
      } else {
        // Ignore if already dropped
        console.log('Index drop attempt (may have already been dropped):', error.message);
      }
    }

    // List indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('Indexes after cleanup:', indexesAfter);

    console.log('Index cleanup complete. The index will be recreated automatically by Mongoose on next model load.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
}

fixIndex();
