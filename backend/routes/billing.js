const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Generate bill for selected tickets
router.post('/generate', auth, async (req, res) => {
  try {
    const { workspaceId, ticketIds, userId, hourlyRate } = req.body;

    // Verify user is workspace owner
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    // Verify user exists and is a member
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMember = workspace.owner.toString() === userId ||
      workspace.members.some(member => member.toString() === userId);

    if (!isMember) {
      return res.status(400).json({ message: 'User is not a member of this workspace' });
    }

    // Get tickets (only stories, not subtasks)
    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      workspace: workspaceId,
      assignee: userId,
      status: 'completed',
      hoursWorked: { $gt: 0 },
      type: 'story' // Only bill for stories
    }).populate('assignee', 'username name');

    if (tickets.length === 0) {
      return res.status(400).json({ message: 'No valid tickets found for billing' });
    }

    // Calculate totals
    const totalHours = tickets.reduce((sum, ticket) => sum + ticket.hoursWorked, 0);
    const totalAmount = totalHours * hourlyRate;

    // Prepare bill data
    const bill = {
      workspace: {
        id: workspace._id,
        name: workspace.name
      },
      user: {
        id: user._id,
        username: user.username,
        name: user.name
      },
      hourlyRate,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        title: ticket.title,
        description: ticket.description,
        hoursWorked: ticket.hoursWorked,
        goLiveDate: ticket.goLiveDate,
        completedAt: ticket.completedAt
      })),
      summary: {
        totalTickets: tickets.length,
        totalHours,
        totalAmount
      },
      generatedAt: new Date()
    };

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get billable tickets for a user in a workspace
router.get('/workspace/:workspaceId/user/:userId', auth, async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    // Verify user is workspace owner
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    // Get completed tickets with hours worked and pending payment (only stories)
    const tickets = await Ticket.find({
      workspace: workspaceId,
      assignee: userId,
      status: 'completed',
      hoursWorked: { $gt: 0 },
      paymentStatus: { $in: ['pending-pay', 'not-applicable'] },
      type: 'story' // Only bill for stories
    })
    .populate('assignee', 'username name')
    .sort({ completedAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all billable tickets in a workspace
router.get('/workspace/:workspaceId/billable', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify user is workspace owner
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    // Get completed tickets with hours worked, grouped by user (only stories)
    const tickets = await Ticket.find({
      workspace: workspaceId,
      status: 'completed',
      hoursWorked: { $gt: 0 },
      paymentStatus: { $in: ['pending-pay', 'not-applicable'] },
      type: 'story' // Only bill for stories
    })
    .populate('assignee', 'username name')
    .sort({ completedAt: -1 });

    // Group by assignee
    const groupedByUser = tickets.reduce((acc, ticket) => {
      const userId = ticket.assignee._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: ticket.assignee,
          tickets: []
        };
      }
      acc[userId].tickets.push(ticket);
      return acc;
    }, {});

    res.json(Object.values(groupedByUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status for tickets
router.patch('/tickets/status', auth, async (req, res) => {
  try {
    const { ticketIds, paymentStatus } = req.body;

    if (!['pending-pay', 'billed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    // Verify user is workspace owner for all tickets
    const tickets = await Ticket.find({ _id: { $in: ticketIds } })
      .populate('workspace', 'owner');

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'No tickets found' });
    }

    // Check all tickets belong to workspaces owned by user
    const allOwned = tickets.every(ticket => 
      ticket.workspace.owner.toString() === req.user._id.toString()
    );

    if (!allOwned) {
      return res.status(403).json({ message: 'You can only update tickets in your own workspaces' });
    }

    // Update payment status
    await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      { paymentStatus }
    );

    const updatedTickets = await Ticket.find({ _id: { $in: ticketIds } })
      .populate('assignee', 'username name')
      .populate('workspace', 'name');

    res.json(updatedTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
