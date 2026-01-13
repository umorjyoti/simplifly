const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  goLiveDate: {
    type: Date,
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  paymentStatus: {
    type: String,
    enum: ['pending-pay', 'billed', 'not-applicable'],
    default: 'not-applicable'
  },
  hoursWorked: {
    type: Number,
    default: 0,
    min: 0
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Update completedAt when ticket is marked as completed
ticketSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    if (this.paymentStatus === 'not-applicable' && this.hoursWorked > 0) {
      this.paymentStatus = 'pending-pay';
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
