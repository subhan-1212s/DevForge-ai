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

// Update Workspace Settings (Owner / Admin)
exports.updateWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update workspace' });
  }
};

// Update Member Role (Owner / Admin)
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id, memberId } = req.params;

    if (!['admin', 'developer', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Only Admin, Developer, and Viewer roles can be assigned.' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Workspace Creator/Owner role cannot be changed
    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({ success: false, message: 'Workspace Owner role cannot be modified.' });
    }

    const member = workspace.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in workspace' });
    }

    member.role = role;

    await workspace.save();
    const updated = await Workspace.findById(id)
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar')
      .populate('projects');

    res.status(200).json({ success: true, workspace: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
};

// Remove Member (Owner / Admin)
exports.removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({ success: false, message: 'Cannot remove workspace owner' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== memberId);
    await workspace.save();

    await User.findByIdAndUpdate(memberId, {
      $pull: { workspaces: id }
    });

    const updated = await Workspace.findById(id)
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar')
      .populate('projects');

    res.status(200).json({ success: true, workspace: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

// Regenerate Invite Code (Owner / Admin)
exports.regenerateInviteCode = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    workspace.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await workspace.save();

    res.status(200).json({ success: true, inviteCode: workspace.inviteCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to regenerate invite code' });
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

    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave workspace. Delete or transfer ownership instead.' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== req.user._id.toString());
    await workspace.save();

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

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only workspace owner can delete it' });
    }

    const memberIds = workspace.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { workspaces: workspace._id } }
    );

    await workspace.deleteOne();

    res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete workspace' });
  }
};
