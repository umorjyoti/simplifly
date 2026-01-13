const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Workspace = require('../models/Workspace');
const TicketHistory = require('../models/TicketHistory');

// Get all tickets for a workspace
router.get('/workspace/:workspaceId', auth, async (req, res) => {
  try {
    // Verify user has access to workspace
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or access denied' });
    }

    const tickets = await Ticket.find({ workspace: req.params.workspaceId })
      .populate('assignee', 'username name')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignee', 'username name')
      .populate('workspace', 'name owner members');

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

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
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

    const history = await TicketHistory.find({ ticket: req.params.id })
      .populate('user', 'username name')
      .sort({ createdAt: 1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create ticket
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, goLiveDate, assignee, workspace } = req.body;

    // Verify user has access to workspace
    const workspaceDoc = await Workspace.findOne({
      _id: workspace,
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    });

    if (!workspaceDoc) {
      return res.status(404).json({ message: 'Workspace not found or access denied' });
    }

    // Verify assignee is a member of the workspace
    const isMember = workspaceDoc.owner.toString() === assignee ||
      workspaceDoc.members.some(member => member.toString() === assignee);

    if (!isMember) {
      return res.status(400).json({ message: 'Assignee must be a member of the workspace' });
    }

    const ticket = new Ticket({
      title,
      description,
      goLiveDate,
      assignee,
      workspace
    });

    await ticket.save();
    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');

    // Create history entry
    const history = new TicketHistory({
      ticket: ticket._id,
      user: req.user._id,
      action: 'created',
      description: `Created ticket "${title}"`
    });
    await history.save();

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket
router.put('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
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

    const { title, description, goLiveDate, assignee, status, paymentStatus } = req.body;
    const oldStatus = ticket.status;
    const oldAssignee = ticket.assignee?.toString();

    // Track status change
    if (status && status !== oldStatus) {
      const history = new TicketHistory({
        ticket: ticket._id,
        user: req.user._id,
        action: 'status_changed',
        oldValue: oldStatus,
        newValue: status,
        description: `Status changed from ${oldStatus} to ${status}`
      });
      await history.save();
    }

    // Track assignee change
    if (assignee && assignee !== oldAssignee) {
      const history = new TicketHistory({
        ticket: ticket._id,
        user: req.user._id,
        action: 'assigned',
        oldValue: oldAssignee,
        newValue: assignee,
        description: `Assignee changed`
      });
      await history.save();
    }

    if (title) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (goLiveDate) ticket.goLiveDate = goLiveDate;
    if (assignee) {
      // Verify assignee is a member
      const isMember = workspace.owner.toString() === assignee ||
        workspace.members.some(member => member.toString() === assignee);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a member of the workspace' });
      }
      ticket.assignee = assignee;
    }
    if (status) ticket.status = status;
    if (paymentStatus) {
      const oldPaymentStatus = ticket.paymentStatus;
      ticket.paymentStatus = paymentStatus;
      if (oldPaymentStatus !== paymentStatus) {
        const history = new TicketHistory({
          ticket: ticket._id,
          user: req.user._id,
          action: 'payment_status_changed',
          oldValue: oldPaymentStatus,
          newValue: paymentStatus,
          description: `Payment status changed from ${oldPaymentStatus} to ${paymentStatus}`
        });
        await history.save();
      }
    }

    await ticket.save();
    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update status (for drag and drop)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('workspace', 'owner members');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user has access
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If moving to completed, require hours worked
    if (status === 'completed' && (!ticket.hoursWorked || ticket.hoursWorked === 0)) {
      return res.status(400).json({ 
        message: 'Cannot mark as completed without hours worked. Please enter hours worked first.' 
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    // Create history entry
    if (oldStatus !== status) {
      const history = new TicketHistory({
        ticket: ticket._id,
        user: req.user._id,
        action: 'status_changed',
        oldValue: oldStatus,
        newValue: status,
        description: `Status changed from ${oldStatus} to ${status}`
      });
      await history.save();
    }

    await ticket.save();
    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update hours worked
router.patch('/:id/hours', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('workspace', 'owner members');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user has access
    const workspace = ticket.workspace;
    const hasAccess = workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(member => member.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { hoursWorked } = req.body;
    if (hoursWorked === undefined || hoursWorked < 0) {
      return res.status(400).json({ message: 'Valid hours worked is required' });
    }

    const oldHours = ticket.hoursWorked;
    ticket.hoursWorked = hoursWorked;

    // Create history entry
    if (oldHours !== hoursWorked) {
      const history = new TicketHistory({
        ticket: ticket._id,
        user: req.user._id,
        action: 'hours_updated',
        oldValue: oldHours?.toString() || '0',
        newValue: hoursWorked.toString(),
        description: `Hours worked updated from ${oldHours || 0} to ${hoursWorked}`
      });
      await history.save();
    }

    await ticket.save();
    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete ticket
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('workspace', 'owner');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only workspace owner can delete
    if (ticket.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can delete tickets' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
