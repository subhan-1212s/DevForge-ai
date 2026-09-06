const Bug = require('../models/Bug');

// Create Bug
exports.createBug = async (req, res) => {
  try {
    const { title, description, severity, status, stepsToReproduce, screenshot, assignee, projectId, workspaceId } = req.body;

    if (!title || !projectId || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Title, project, and workspace IDs are required' });
    }

    const bug = await Bug.create({
      title,
      description,
      severity: severity || 'medium',
      status: status || 'open',
      stepsToReproduce: stepsToReproduce || '',
      screenshot: screenshot || '',
      assignee: assignee || null,
      projectId,
      workspaceId
    });

    res.status(201).json({ success: true, bug });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Creating bug failed' });
  }
};

// Get Project Bugs
exports.getProjectBugs = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const bugs = await Bug.find({ projectId }).populate('assignee', 'name email avatar');
    res.status(200).json({ success: true, bugs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching bugs failed' });
  }
};

// Update Bug
exports.updateBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const { title, description, severity, status, stepsToReproduce, screenshot, assignee } = req.body;

    bug.title = title !== undefined ? title : bug.title;
    bug.description = description !== undefined ? description : bug.description;
    bug.severity = severity !== undefined ? severity : bug.severity;
    bug.status = status !== undefined ? status : bug.status;
    bug.stepsToReproduce = stepsToReproduce !== undefined ? stepsToReproduce : bug.stepsToReproduce;
    bug.screenshot = screenshot !== undefined ? screenshot : bug.screenshot;
    bug.assignee = assignee !== undefined ? (assignee || null) : bug.assignee;

    await bug.save();
    
    const updated = await Bug.findById(bug._id).populate('assignee', 'name email avatar');

    res.status(200).json({ success: true, bug: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Updating bug failed' });
  }
};

// Delete Bug
exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    await bug.deleteOne();
    res.status(200).json({ success: true, message: 'Bug deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Deleting bug failed' });
  }
};
