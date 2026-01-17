const auth = require('./auth');

const superadmin = (req, res, next) => {
  // First check authentication
  auth(req, res, () => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Superadmin access required' });
    }

    next();
  });
};

module.exports = superadmin;
