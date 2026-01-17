const express = require('express');
const router = express.Router();
const superadmin = require('../middleware/superadmin');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Visit = require('../models/Visit');

// Get dashboard statistics
router.get('/stats', superadmin, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    // Calculate date range based on period
    let startDate = null;
    const endDate = new Date();
    
    if (period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Total users
    const totalUsers = await User.countDocuments();
    
    // Users signed up in period
    const userQuery = startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};
    const usersInPeriod = await User.countDocuments(userQuery);
    
    // Total workspaces
    const totalWorkspaces = await Workspace.countDocuments();
    
    // Workspaces created in period
    const workspaceQuery = startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};
    const workspacesInPeriod = await Workspace.countDocuments(workspaceQuery);
    
    // Total visits
    const visitQuery = startDate ? { visitedAt: { $gte: startDate, $lte: endDate } } : {};
    const totalVisits = await Visit.countDocuments(visitQuery);
    
    // Unique visitors in period (only logged-in users)
    const uniqueVisitors = await Visit.distinct('userId', {
      ...visitQuery,
      userId: { $ne: null } // Only count visits with userId (logged-in users)
    });
    const uniqueVisitorsCount = uniqueVisitors.length;
    
    // Anonymous visits count
    const anonymousVisits = await Visit.countDocuments({
      ...visitQuery,
      userId: null
    });
    
    // User signups over time (for chart data)
    const signupsByPeriod = await User.aggregate([
      ...(startDate ? [{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Visits over time
    const visitsByPeriod = await Visit.aggregate([
      ...(startDate ? [{ $match: { visitedAt: { $gte: startDate, $lte: endDate } } }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$visitedAt' },
            month: { $month: '$visitedAt' },
            day: { $dayOfMonth: '$visitedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      totalUsers,
      usersInPeriod,
      totalWorkspaces,
      workspacesInPeriod,
      totalVisits,
      uniqueVisitorsCount,
      anonymousVisits,
      signupsByPeriod,
      visitsByPeriod,
      period
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all workspaces
router.get('/workspaces', superadmin, async (req, res) => {
  try {
    const workspaces = await Workspace.find()
      .populate('owner', 'username name email')
      .populate('members', 'username name email')
      .sort({ createdAt: -1 });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single workspace (superadmin can access any)
router.get('/workspace/:id', superadmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'username name email')
      .populate('members', 'username name email');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
