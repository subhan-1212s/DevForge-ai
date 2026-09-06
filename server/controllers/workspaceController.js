const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Create Workspace
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    // Add workspace to user's workspaces array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workspaces: workspace._id }
    });

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Creating workspace failed' });
  }
};

// Get all workspaces for current user
exports.getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'name email avatar');

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching workspaces failed' });
  }
};

// Get workspace details (members populated, projects populated)
exports.getWorkspaceDetails = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar')
      .populate('projects');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    res.status(200).json({ success: true, workspace, role: req.userWorkspaceRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching workspace details failed' });
  }
};

// Join Workspace via invite code
exports.joinWorkspace = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if already a member
    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this workspace' });
    }

    // Add user as developer
    workspace.members.push({ user: req.user._id, role: 'developer' });
    await workspace.save();

    // Add to user's workspaces
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workspaces: workspace._id }
    });

    res.status(200).json({ success: true, message: 'Workspace joined successfully', workspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to join workspace' });
  }
};

// Leave Workspace
exports.leaveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Owner cannot leave workspace without transferring ownership or deleting
    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave workspace. Delete or transfer ownership instead.' });
    }

    // Remove from workspace members
    workspace.members = workspace.members.filter(m => m.user.toString() !== req.user._id.toString());
    await workspace.save();

    // Remove from user workspaces
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { workspaces: workspace._id }
    });

    res.status(200).json({ success: true, message: 'Left workspace successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to leave workspace' });
  }
};

// Delete Workspace
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Only owner can delete workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only workspace owner can delete it' });
    }

    // Remove workspace from all members' User models
    const memberIds = workspace.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { workspaces: workspace._id } }
    );

    // Delete the workspace itself
    await workspace.deleteOne();

    res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete workspace' });
  }
};
