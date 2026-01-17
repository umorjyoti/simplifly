const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');

// Get all workspaces for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate('owner', 'username name')
    .populate('members', 'username name')
    .sort({ createdAt: -1 });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single workspace
router.get('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate('owner', 'username name')
    .populate('members', 'username name');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create workspace
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = new Workspace({
      name,
      description,
      owner: req.user._id
    });

    await workspace.save();
    await workspace.populate('owner', 'username name');
    await workspace.populate('members', 'username name');

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workspace
router.put('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    const { name, description, settings } = req.body;
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) {
      workspace.settings = workspace.settings || {};
      if (settings.periodType) {
        if (!['weekly', 'monthly', 'quarterly'].includes(settings.periodType)) {
          return res.status(400).json({ message: 'Invalid period type. Must be weekly, monthly, or quarterly' });
        }
        workspace.settings.periodType = settings.periodType;
      }
      if (settings.currency) {
        if (!['USD', 'INR'].includes(settings.currency)) {
          return res.status(400).json({ message: 'Invalid currency. Must be USD or INR' });
        }
        workspace.settings.currency = settings.currency;
      }
    }

    await workspace.save();
    await workspace.populate('owner', 'username name');
    await workspace.populate('members', 'username name');

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to workspace
router.post('/:id/members', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    const { userId } = req.body;
    if (!workspace.members.includes(userId)) {
      workspace.members.push(userId);
      await workspace.save();
    }

    await workspace.populate('owner', 'username name');
    await workspace.populate('members', 'username name');

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from workspace
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    workspace.members = workspace.members.filter(
      memberId => memberId.toString() !== req.params.userId
    );

    await workspace.save();
    await workspace.populate('owner', 'username name');
    await workspace.populate('members', 'username name');

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete workspace
router.delete('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
    }

    await workspace.deleteOne();
    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
