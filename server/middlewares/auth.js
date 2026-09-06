const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const mongoose = require('mongoose');

// Protect routes - Verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devforge_access_token_secret_key_12345');
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

// Check if user is a member of the workspace and has appropriate role
const checkWorkspaceRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        return res.status(400).json({ success: false, message: 'Workspace ID is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ success: false, message: 'Invalid Workspace ID format' });
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ success: false, message: 'Workspace not found' });
      }

      // Check if owner
      if (workspace.owner.toString() === req.user._id.toString()) {
        req.workspace = workspace;
        req.userWorkspaceRole = 'owner';
        return next();
      }

      const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
      if (!member) {
        return res.status(403).json({ success: false, message: 'Access denied: Not a member of this workspace' });
      }

      // If roles are specified, verify match
      if (roles.length > 0 && !roles.includes(member.role)) {
        return res.status(403).json({ success: false, message: `Access denied: Role '${member.role}' is insufficient` });
      }

      req.workspace = workspace;
      req.userWorkspaceRole = member.role;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server authorization error' });
    }
  };
};

module.exports = { protect, checkWorkspaceRole };
