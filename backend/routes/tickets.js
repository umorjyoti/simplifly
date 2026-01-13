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
      .populate('parentTicket', 'title type')
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
      .populate('workspace', 'name owner members')
      .populate('parentTicket', 'title type');

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

// Get subtasks for a ticket
router.get('/:id/subtasks', auth, async (req, res) => {
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

    const subtasks = await Ticket.find({ 
      parentTicket: req.params.id,
      type: 'subtask'
    })
      .populate('assignee', 'username name')
      .populate('workspace', 'name')
      .sort({ createdAt: 1 });

    res.json(subtasks);
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

// Helper function to generate workspace initials
function getWorkspaceInitials(workspaceName) {
  if (!workspaceName || typeof workspaceName !== 'string') {
    return 'WS'; // Default fallback
  }
  
  // Remove special characters and split into words
  const cleanName = workspaceName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'WS'; // Default fallback
  }
  
  if (words.length === 1) {
    // Single word: take first 2 uppercase letters (or pad if too short)
    const word = words[0].toUpperCase();
    return word.length >= 2 ? word.substring(0, 2) : word.padEnd(2, 'X');
  }
  
  // Multiple words: take first letter of each word (up to 2 words)
  const initials = words.slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials.length >= 2 ? initials : initials.padEnd(2, 'X');
}

// Helper function to generate ticket number
async function generateTicketNumber(workspaceId, workspaceName, ticketType) {
  const initials = getWorkspaceInitials(workspaceName);
  const prefix = ticketType === 'subtask' ? `${initials}SUB` : initials;
  
  // Find the highest ticket number for this workspace and type
  // Escape special regex characters in prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existingTickets = await Ticket.find({
    workspace: workspaceId,
    type: ticketType,
    ticketNumber: { $regex: `^${escapedPrefix}` }
  }).sort({ ticketNumber: -1 }).limit(1);

  let nextNumber = 1;
  if (existingTickets.length > 0 && existingTickets[0].ticketNumber) {
    // Extract the number part from the ticket number (e.g., "TP0001" -> 1)
    const match = existingTickets[0].ticketNumber.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  // Format as 4-digit number with leading zeros
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// Create ticket
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, goLiveDate, assignee, workspace, type, parentTicket } = req.body;

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

    // If creating a subtask, validate parent ticket
    if (type === 'subtask') {
      if (!parentTicket) {
        return res.status(400).json({ message: 'Subtask must have a parent ticket' });
      }

      const parent = await Ticket.findById(parentTicket)
        .populate('workspace', 'owner members');

      if (!parent) {
        return res.status(404).json({ message: 'Parent ticket not found' });
      }

      // Verify parent is in the same workspace
      if (parent.workspace._id.toString() !== workspace) {
        return res.status(400).json({ message: 'Parent ticket must be in the same workspace' });
      }

      // Prevent creating subtasks inside subtasks
      if (parent.type === 'subtask') {
        return res.status(400).json({ message: 'Cannot create subtask inside a subtask' });
      }

      // Verify user has access to parent ticket's workspace
      const hasAccess = parent.workspace.owner.toString() === req.user._id.toString() ||
        parent.workspace.members.some(member => member.toString() === req.user._id.toString());

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to parent ticket' });
      }
    }

    // Generate ticket number
    const ticketType = type || 'story';
    const ticketNumber = await generateTicketNumber(workspace, workspaceDoc.name, ticketType);

    const ticket = new Ticket({
      ticketNumber,
      title,
      description,
      goLiveDate,
      assignee,
      workspace,
      type: ticketType,
      parentTicket: type === 'subtask' ? parentTicket : null
    });

    await ticket.save();
    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');
    if (ticket.parentTicket) {
      await ticket.populate('parentTicket', 'title');
    }

    // Create history entry
    const historyTypeLabel = ticketType === 'subtask' ? 'subtask' : 'ticket';
    const history = new TicketHistory({
      ticket: ticket._id,
      user: req.user._id,
      action: 'created',
      description: `Created ${historyTypeLabel} "${title}"`
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

    const { title, description, goLiveDate, assignee, status, paymentStatus, type, parentTicket } = req.body;
    const oldStatus = ticket.status;
    const oldAssignee = ticket.assignee?.toString();

    // Prevent changing ticket type after creation
    if (type && type !== ticket.type) {
      return res.status(400).json({ message: 'Cannot change ticket type after creation' });
    }

    // Prevent changing parentTicket after creation
    if (parentTicket !== undefined) {
      const currentParent = ticket.parentTicket?.toString() || null;
      const newParent = parentTicket || null;
      if (currentParent !== newParent) {
        return res.status(400).json({ message: 'Cannot change parent ticket after creation' });
      }
    }

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
    if (ticket.parentTicket) {
      await ticket.populate('parentTicket', 'title type');
    }

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
    if (ticket.parentTicket) {
      await ticket.populate('parentTicket', 'title type');
    }

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

    // If this is a subtask, aggregate hours to parent story
    if (ticket.type === 'subtask' && ticket.parentTicket) {
      const parentStory = await Ticket.findById(ticket.parentTicket);
      if (parentStory) {
        // Calculate total hours from all subtasks
        const allSubtasks = await Ticket.find({
          parentTicket: ticket.parentTicket,
          type: 'subtask'
        });
        const totalSubtaskHours = allSubtasks.reduce((sum, subtask) => sum + (subtask.hoursWorked || 0), 0);
        
        // Update parent story hours (only count subtask hours, don't override direct hours)
        // If parent has direct hours, we keep them separate, but for billing we'll use subtask hours
        // Actually, let's set parent hours to the sum of all subtask hours
        parentStory.hoursWorked = totalSubtaskHours;
        await parentStory.save();
      }
    }

    await ticket.populate('assignee', 'username name');
    await ticket.populate('workspace', 'name');
    if (ticket.parentTicket) {
      await ticket.populate('parentTicket', 'title');
    }

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

    // If deleting a subtask, recalculate parent story hours
    const parentTicketId = ticket.type === 'subtask' ? ticket.parentTicket : null;

    await ticket.deleteOne();

    // Recalculate parent story hours if this was a subtask
    if (parentTicketId) {
      const parentStory = await Ticket.findById(parentTicketId);
      if (parentStory) {
        const allSubtasks = await Ticket.find({
          parentTicket: parentTicketId,
          type: 'subtask'
        });
        const totalSubtaskHours = allSubtasks.reduce((sum, subtask) => sum + (subtask.hoursWorked || 0), 0);
        parentStory.hoursWorked = totalSubtaskHours;
        await parentStory.save();
      }
    }

    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
