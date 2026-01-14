const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const BillItem = require('../models/BillItem');

// Generate bill for selected tickets
router.post('/generate', auth, async (req, res) => {
  try {
    const { workspaceId, ticketIds, userId, hourlyRate, manualItemIds, isAgencyLevel } = req.body;

    // Verify user is workspace owner
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    // Get tickets if any are selected
    let tickets = [];
    if (ticketIds && ticketIds.length > 0) {
      const ticketQuery = {
        _id: { $in: ticketIds },
        workspace: workspaceId,
        status: 'completed',
        hoursWorked: { $gt: 0 },
        type: 'story'
      };

      // If not agency level, filter by user
      if (!isAgencyLevel && userId) {
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

        ticketQuery.assignee = userId;
      }

      tickets = await Ticket.find(ticketQuery).populate('assignee', 'username name');
    }

    // Get manual bill items if any are selected
    let manualItems = [];
    if (manualItemIds && manualItemIds.length > 0) {
      manualItems = await BillItem.find({
        _id: { $in: manualItemIds },
        workspace: workspaceId
      }).populate('user', 'username name');
    }

    // Combine tickets and manual items into work items
    const workItems = [
      ...tickets.map(ticket => ({
        id: ticket._id,
        title: ticket.title,
        description: ticket.description,
        hours: ticket.hoursWorked,
        type: 'ticket',
        user: ticket.assignee ? {
          id: ticket.assignee._id,
          username: ticket.assignee.username,
          name: ticket.assignee.name
        } : null,
        goLiveDate: ticket.goLiveDate,
        completedAt: ticket.completedAt
      })),
      ...manualItems.map(item => ({
        id: item._id,
        title: item.title,
        description: item.description,
        hours: item.hours,
        type: 'manual',
        user: item.user ? {
          id: item.user._id,
          username: item.user.username,
          name: item.user.name
        } : null,
        createdAt: item.createdAt
      }))
    ];

    if (workItems.length === 0) {
      return res.status(400).json({ message: 'No work items selected for billing' });
    }

    // Calculate totals
    const totalHours = workItems.reduce((sum, item) => sum + item.hours, 0);
    const totalAmount = totalHours * hourlyRate;

    // Get user info if not agency level
    let userInfo = null;
    if (userId && !isAgencyLevel) {
      const user = await User.findById(userId);
      if (user) {
        userInfo = {
          id: user._id,
          username: user.username,
          name: user.name
        };
      }
    }

    // Prepare bill data
    const bill = {
      workspace: {
        id: workspace._id,
        name: workspace.name
      },
      isAgencyLevel: isAgencyLevel || false,
      user: userInfo,
      hourlyRate,
      workItems,
      summary: {
        totalItems: workItems.length,
        totalTickets: tickets.length,
        totalManualItems: manualItems.length,
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

// Get all billable tickets for agency-level billing (all users)
router.get('/workspace/:workspaceId/billable/all', auth, async (req, res) => {
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

    // Get all completed tickets with hours worked (only stories)
    const tickets = await Ticket.find({
      workspace: workspaceId,
      status: 'completed',
      hoursWorked: { $gt: 0 },
      paymentStatus: { $in: ['pending-pay', 'not-applicable'] },
      type: 'story'
    })
    .populate('assignee', 'username name')
    .sort({ completedAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a manual bill item
router.post('/workspace/:workspaceId/manual-item', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, hours, userId } = req.body;

    // Verify user is workspace owner
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    if (!title || !hours || hours <= 0) {
      return res.status(400).json({ message: 'Title and valid hours are required' });
    }

    // If userId is provided, verify user is a member
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMember = workspace.owner.toString() === userId ||
        workspace.members.some(member => member.toString() === userId);

      if (!isMember) {
        return res.status(400).json({ message: 'User is not a member of this workspace' });
      }
    }

    const billItem = new BillItem({
      workspace: workspaceId,
      title,
      description: description || '',
      hours: parseFloat(hours),
      user: userId || null,
      isManual: true
    });

    await billItem.save();
    await billItem.populate('user', 'username name');

    res.json(billItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all manual bill items for a workspace
router.get('/workspace/:workspaceId/manual-items', auth, async (req, res) => {
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

    const manualItems = await BillItem.find({
      workspace: workspaceId,
      isManual: true
    })
    .populate('user', 'username name')
    .sort({ createdAt: -1 });

    res.json(manualItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a manual bill item
router.put('/manual-item/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, description, hours, userId } = req.body;

    const billItem = await BillItem.findById(itemId).populate('workspace', 'owner');

    if (!billItem) {
      return res.status(404).json({ message: 'Bill item not found' });
    }

    // Verify user is workspace owner
    if (billItem.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) billItem.title = title;
    if (description !== undefined) billItem.description = description;
    if (hours !== undefined) {
      if (hours <= 0) {
        return res.status(400).json({ message: 'Hours must be greater than 0' });
      }
      billItem.hours = parseFloat(hours);
    }
    if (userId !== undefined) {
      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        billItem.user = userId;
      } else {
        billItem.user = null;
      }
    }

    await billItem.save();
    await billItem.populate('user', 'username name');

    res.json(billItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a manual bill item
router.delete('/manual-item/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const billItem = await BillItem.findById(itemId).populate('workspace', 'owner');

    if (!billItem) {
      return res.status(404).json({ message: 'Bill item not found' });
    }

    // Verify user is workspace owner
    if (billItem.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await BillItem.findByIdAndDelete(itemId);

    res.json({ message: 'Bill item deleted successfully' });
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
