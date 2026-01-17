const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous visits
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  visitedAt: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
visitSchema.index({ userId: 1, visitedAt: -1 });
visitSchema.index({ workspaceId: 1, visitedAt: -1 });
visitSchema.index({ visitedAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
