const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const TicketHistory = require('../models/TicketHistory');
const Workspace = require('../models/Workspace');

// Get comments for a ticket
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

    const comments = await Comment.find({ ticket: req.params.ticketId })
      .populate('user', 'username name')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { ticketId, content } = req.body;

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

    const comment = new Comment({
      ticket: ticketId,
      user: req.user._id,
      content
    });

    await comment.save();
    await comment.populate('user', 'username name');

    // Create history entry
    const history = new TicketHistory({
      ticket: ticketId,
      user: req.user._id,
      action: 'commented',
      description: `Added a comment`
    });
    await history.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment owner can delete
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
