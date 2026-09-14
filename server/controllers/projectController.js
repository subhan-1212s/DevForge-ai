const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

// Create Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, techStack, status, priority, deadline, progress, repositoryUrl, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Project name and Workspace ID are required' });
    }

    const project = await Project.create({
      name,
      description,
      techStack: techStack || [],
      status: status || 'planning',
      priority: priority || 'medium',
      deadline,
      progress: progress || 0,
      repositoryUrl: repositoryUrl || '',
      workspaceId
    });

    // Add project to Workspace projects array
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { projects: project._id }
    });

    // Notify all workspace teammates of new project creation
    const { notifyWorkspaceTeammates } = require('../services/notificationService');
    notifyWorkspaceTeammates({
      senderId: req.user._id,
      workspaceId,
      projectId: project._id,
      type: 'project_created',
      message: `created a new project: "${project.name}"`
    }).catch(err => console.error("Notification dispatch error:", err));

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Creating project failed' });
  }
};

// Get all projects for a workspace
exports.getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID query parameter is required' });
    }

    const projects = await Project.find({ workspaceId });
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching projects failed' });
  }
};

// Get details of a single project
exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify workspace access
    const workspace = await Workspace.findById(project.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Parent workspace not found' });
    }

    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString()) || workspace.owner.toString() === req.user._id.toString();

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied: Not a member of this workspace' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching project details failed' });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify workspace role permission (Owner or Admin required to modify status/progress/settings)
    const workspace = await Workspace.findById(project.workspaceId);
    if (workspace) {
      const isOwner = workspace.owner.toString() === req.user._id.toString();
      const memberObj = workspace.members.find(m => m.user.toString() === req.user._id.toString());
      const role = isOwner ? 'owner' : (memberObj ? memberObj.role : null);

      if (!['owner', 'admin'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Access denied: Only Workspace Owners and Admins can modify project settings' });
      }
    }

    const { name, description, techStack, status, priority, deadline, progress, repositoryUrl } = req.body;

    project.name = name !== undefined ? name : project.name;
    project.description = description !== undefined ? description : project.description;
    project.techStack = techStack !== undefined ? techStack : project.techStack;
    project.status = status !== undefined ? status : project.status;
    project.priority = priority !== undefined ? priority : project.priority;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.progress = progress !== undefined ? progress : project.progress;
    project.repositoryUrl = repositoryUrl !== undefined ? repositoryUrl : project.repositoryUrl;

    await project.save();

    // Notify all workspace teammates of project settings update
    const { notifyWorkspaceTeammates } = require('../services/notificationService');
    notifyWorkspaceTeammates({
      senderId: req.user._id,
      workspaceId: project.workspaceId,
      projectId: project._id,
      type: 'project_updated',
      message: `updated project "${project.name}" settings (Status: ${project.status.toUpperCase()}, Progress: ${project.progress}%)`
    }).catch(err => console.error("Notification dispatch error:", err));

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Updating project failed' });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Remove project from workspace projects array
    await Workspace.findByIdAndUpdate(project.workspaceId, {
      $pull: { projects: project._id }
    });

    // Delete the project
    await project.deleteOne();

    // Notify all workspace teammates of project deletion
    const { notifyWorkspaceTeammates } = require('../services/notificationService');
    notifyWorkspaceTeammates({
      senderId: req.user._id,
      workspaceId: project.workspaceId,
      projectId: project._id,
      type: 'project_deleted',
      message: `deleted project: "${project.name}"`
    }).catch(err => console.error("Notification dispatch error:", err));

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Deleting project failed' });
  }
};
