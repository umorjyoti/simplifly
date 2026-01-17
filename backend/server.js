const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/subtasks', require('./routes/subtasks'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/invites', require('./routes/invites'));
app.use('/api/superadmin', require('./routes/superadmin'));

// Connect to MongoDB with proper options for Atlas replica sets
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds - time to wait for server selection
  socketTimeoutMS: 45000, // 45 seconds - time to wait for socket operations
  connectTimeoutMS: 30000, // 30 seconds - time to wait for initial connection
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simplifly', mongooseOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Log more details for debugging
    if (err.name === 'MongoServerError') {
      console.error('MongoDB Server Error Details:', {
        code: err.code,
        codeName: err.codeName,
        message: err.message
      });
    }
  });

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
