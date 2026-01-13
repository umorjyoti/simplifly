const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subtask = require('../models/Subtask');
const Ticket = require('../models/Ticket');
const TicketHistory = require('../models/TicketHistory');
const Workspace = require('../models/Workspace');

// Get all subtasks for a ticket
router.get('/ticket/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('workspace', 'owner members');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user has access to workspace
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subtasks = await Subtask.find({ ticket: req.params.ticketId })
      .sort({ order: 1, createdAt: 1 });

    res.json(subtasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create subtask
router.post('/', auth, async (req, res) => {
  try {
    const { ticketId, title, description, order } = req.body;

    const ticket = await Ticket.findById(ticketId)
      .populate('workspace', 'owner members');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user has access to workspace
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subtask = new Subtask({
      ticket: ticketId,
      title,
      description,
      order: order || 0
    });

    await subtask.save();

    // Create history entry
    const history = new TicketHistory({
      ticket: ticketId,
      user: req.user._id,
      action: 'commented',
      description: `Added subtask: "${title}"`
    });
    await history.save();

    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update subtask
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, completed, order } = req.body;

    const subtask = await Subtask.findById(req.params.id)
      .populate('ticket', 'workspace');

    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const ticket = await Ticket.findById(subtask.ticket._id)
      .populate('workspace', 'owner members');

    // Verify user has access to workspace
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title !== undefined) subtask.title = title;
    if (description !== undefined) subtask.description = description;
    if (completed !== undefined) subtask.completed = completed;
    if (order !== undefined) subtask.order = order;

    await subtask.save();

    res.json(subtask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete subtask
router.delete('/:id', auth, async (req, res) => {
  try {
    const subtask = await Subtask.findById(req.params.id)
      .populate('ticket', 'workspace');

    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const ticket = await Ticket.findById(subtask.ticket._id)
      .populate('workspace', 'owner members');

    // Verify user has access to workspace
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await subtask.deleteOne();
    res.json({ message: 'Subtask deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
