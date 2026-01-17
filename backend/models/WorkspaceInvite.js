const mongoose = require('mongoose');
const crypto = require('crypto');

const workspaceInviteSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  inviteToken: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  }
}, {
  timestamps: true
});

// Index for faster lookups
// Note: inviteToken already has an index from unique: true, so we don't need to add it again
workspaceInviteSchema.index({ workspace: 1, status: 1 });

module.exports = mongoose.model('WorkspaceInvite', workspaceInviteSchema);
