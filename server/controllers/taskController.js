const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

const createAndEmitNotification = async ({ user, sender, type, message, workspaceId, projectId, taskId }) => {
  try {
    const notification = await Notification.create({
      user,
      sender,
      type,
      message,
      workspaceId,
      projectId,
      taskId
    });

    const populated = await Notification.findById(notification._id)
      .populate('sender', 'name email avatar');

    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(`user:${user}`).emit('notification_received', populated);

    // Dispatch email alert via Brevo REST API
    const recipientUser = await User.findById(user);
    const senderUser = await User.findById(sender);

    if (recipientUser && recipientUser.email) {
      const { sendEmail } = require('../services/emailService');
      const subject = `[DevForge AI] New Alert: ${type.replace('_', ' ').toUpperCase()}`;
      const htmlContent = `
        <div style="font-family: sans-serif; color: #1d1d1f; max-width: 500px; padding: 20px; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #0071e3; margin-top: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">DevForge AI Workspace</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #1d1d1f;">Hello <strong>${recipientUser.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #1d1d1f;"><strong>${senderUser ? senderUser.name : 'A team member'}</strong> ${message}.</p>
          <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 20px 0;" />
          <p style="font-size: 11px; color: #86868b; line-height: 1.5; margin-bottom: 0;">This is an automated workspace notification. Access your dashboard at <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color: #0071e3; text-decoration: none;">DevForge AI Portal</a> to view changes.</p>
        </div>
      `;

      sendEmail({
        to: recipientUser.email,
        subject,
        htmlContent
      }).catch(err => console.error('Brevo notification error:', err));
    }
  } catch (err) {
    console.error('Error creating/emitting notification:', err);
  }
};


// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, assignee, projectId, workspaceId, checklist } = req.body;

    if (!title || !projectId || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Title, project, and workspace IDs are required' });
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      deadline,
      assignee: assignee || null,
      projectId,
      workspaceId,
      checklist: checklist || [],
      activity: [{ user: req.user._id, text: 'created this task' }]
    });

    // Notify assignee if set
    if (assignee && assignee.toString() !== req.user._id.toString()) {
      await createAndEmitNotification({
        user: assignee,
        sender: req.user._id,
        type: 'task_assigned',
        message: `assigned you the task: "${title}"`,
        workspaceId,
        projectId,
        taskId: task._id
      });
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Creating task failed' });
  }
};

// Get Tasks by Project ID
exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching project tasks failed' });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, status, priority, deadline, assignee, checklist } = req.body;
    let activityText = '';

    // Log changes to activity history
    if (status && status !== task.status) {
      activityText = `moved task to "${status.replace('_', ' ')}"`;
    } else if (assignee && assignee.toString() !== (task.assignee ? task.assignee.toString() : '')) {
      activityText = 'changed assignee';
    } else {
      activityText = 'updated task properties';
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status !== undefined ? status : task.status;
    task.priority = priority !== undefined ? priority : task.priority;
    task.deadline = deadline !== undefined ? deadline : task.deadline;
    task.assignee = assignee !== undefined ? (assignee || null) : task.assignee;
    task.checklist = checklist !== undefined ? checklist : task.checklist;

    // Push activity
    task.activity.push({ user: req.user._id, text: activityText });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    // Notify new assignee if changed
    if (assignee && assignee.toString() !== req.user._id.toString() && assignee.toString() !== (task.assignee ? task.assignee.toString() : '')) {
      await createAndEmitNotification({
        user: assignee,
        sender: req.user._id,
        type: 'task_assigned',
        message: `assigned you the task: "${task.title}"`,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id
      });
    }

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Updating task failed' });
  }
};

// Add Task Comment
exports.addTaskComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    task.comments.push({ user: req.user._id, text });
    task.activity.push({ user: req.user._id, text: 'added a comment' });
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    // Notify assignee of the comment if not the sender
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      await createAndEmitNotification({
        user: task.assignee,
        sender: req.user._id,
        type: 'comment_added',
        message: `commented on task: "${task.title}"`,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id
      });
    }

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Adding comment failed' });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Deleting task failed' });
  }
};
