const mongoose = require('mongoose');

const ticketHistorySchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'status_changed', 'assigned', 'hours_updated', 'payment_status_changed', 'commented']
  },
  oldValue: {
    type: String
  },
  newValue: {
    type: String
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TicketHistory', ticketHistorySchema);
