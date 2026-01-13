const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Helper function to generate frontend URL
const getFrontendUrl = (req) => {
  // If FRONTEND_URL is explicitly set, use it
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // For development, use FRONTEND_PORT or default to 3000
  const frontendPort = process.env.FRONTEND_PORT || '3000';
  const host = req.get('host');
  
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://localhost:${frontendPort}`;
  }
  
  // For production, use the same protocol and host but replace backend port with frontend port
  return `${req.protocol}://${host.replace(':3002', `:${frontendPort}`)}`;
};

// Generate or get invite link for a workspace
router.post('/workspace/:workspaceId/generate', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only workspace owner can generate invite links
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can generate invite links' });
    }

    // Check if there's already a pending invite link for this workspace
    let invite = await WorkspaceInvite.findOne({
      workspace: req.params.workspaceId,
      status: 'pending',
      requestedBy: null
    });

    // If no pending invite exists, create a new one
    if (!invite) {
      invite = new WorkspaceInvite({
        workspace: req.params.workspaceId
      });
      await invite.save();
    }

    await invite.populate('workspace', 'name');

    const frontendUrl = getFrontendUrl(req);
    res.json({
      inviteToken: invite.inviteToken,
      inviteLink: `${frontendUrl}/join/${invite.inviteToken}`,
      workspace: invite.workspace
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invite link for a workspace (if exists)
router.get('/workspace/:workspaceId', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only workspace owner can view invite link
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can view invite links' });
    }

    const invite = await WorkspaceInvite.findOne({
      workspace: req.params.workspaceId,
      status: 'pending',
      requestedBy: null
    }).populate('workspace', 'name');

    if (!invite) {
      return res.json({ inviteLink: null, inviteToken: null });
    }

    const frontendUrl = getFrontendUrl(req);
    res.json({
      inviteToken: invite.inviteToken,
      inviteLink: `${frontendUrl}/join/${invite.inviteToken}`,
      workspace: invite.workspace
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request to join workspace via invite token
router.post('/join/:token', auth, async (req, res) => {
  try {
    const invite = await WorkspaceInvite.findOne({
      inviteToken: req.params.token,
      status: 'pending'
    }).populate('workspace', 'name owner members');

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite link has expired' });
    }

    const workspace = invite.workspace;

    // Check if user is already a member
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    const isMember = workspace.members.some(
      member => member.toString() === req.user._id.toString()
    );

    if (isOwner || isMember) {
      return res.status(400).json({ message: 'You are already a member of this workspace' });
    }

    // Check if user has already requested to join
    const existingRequest = await WorkspaceInvite.findOne({
      workspace: workspace._id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You have already requested to join this workspace',
        request: existingRequest
      });
    }

    // Create join request with a new unique token
    const joinRequest = new WorkspaceInvite({
      workspace: workspace._id,
      inviteToken: crypto.randomBytes(32).toString('hex'), // Generate unique token for join request
      requestedBy: req.user._id,
      status: 'pending'
    });

    await joinRequest.save();
    await joinRequest.populate('requestedBy', 'username name');
    await joinRequest.populate('workspace', 'name');

    res.status(201).json({
      message: 'Join request sent successfully',
      request: joinRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all pending join requests for workspaces owned by user
router.get('/requests', auth, async (req, res) => {
  try {
    // Get all workspaces owned by user
    const workspaces = await Workspace.find({ owner: req.user._id });
    const workspaceIds = workspaces.map(w => w._id);

    // Get all pending requests for these workspaces
    const requests = await WorkspaceInvite.find({
      workspace: { $in: workspaceIds },
      status: 'pending',
      requestedBy: { $ne: null }
    })
      .populate('workspace', 'name')
      .populate('requestedBy', 'username name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending requests for a specific workspace
router.get('/workspace/:workspaceId/requests', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only workspace owner can view requests
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can view join requests' });
    }

    const requests = await WorkspaceInvite.find({
      workspace: req.params.workspaceId,
      status: 'pending',
      requestedBy: { $ne: null }
    })
      .populate('requestedBy', 'username name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve join request
router.post('/requests/:requestId/approve', auth, async (req, res) => {
  try {
    const request = await WorkspaceInvite.findById(req.params.requestId)
      .populate('workspace', 'owner members');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const workspace = request.workspace;

    // Only workspace owner can approve requests
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can approve requests' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Add user to workspace members
    const userId = request.requestedBy;
    if (!workspace.members.includes(userId)) {
      workspace.members.push(userId);
      await workspace.save();
    }

    // Update request status
    request.status = 'approved';
    await request.save();

    await request.populate('requestedBy', 'username name');
    await request.populate('workspace', 'name');

    res.json({
      message: 'Join request approved',
      request,
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject join request
router.post('/requests/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await WorkspaceInvite.findById(req.params.requestId)
      .populate('workspace', 'owner');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const workspace = request.workspace;

    // Only workspace owner can reject requests
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can reject requests' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status
    request.status = 'rejected';
    await request.save();

    await request.populate('requestedBy', 'username name');
    await request.populate('workspace', 'name');

    res.json({
      message: 'Join request rejected',
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invite info by token (public, for join page)
router.get('/token/:token', async (req, res) => {
  try {
    const invite = await WorkspaceInvite.findOne({
      inviteToken: req.params.token,
      status: 'pending',
      requestedBy: null
    }).populate('workspace', 'name description owner');

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite link has expired' });
    }

    res.json({
      inviteToken: invite.inviteToken,
      workspace: invite.workspace
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
