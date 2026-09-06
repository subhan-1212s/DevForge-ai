const Message = require('../models/Message');

// Send Chat Message
exports.sendMessage = async (req, res) => {
  try {
    const { text, workspaceId, projectId, attachments } = req.body;

    if (!text || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Message text and Workspace ID are required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      text,
      workspaceId,
      projectId: projectId || null,
      attachments: attachments || []
    });

    const populatedMsg = await Message.findById(message._id).populate('sender', 'name email avatar');

    res.status(201).json({ success: true, message: populatedMsg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Get Messages
exports.getMessages = async (req, res) => {
  try {
    const { workspaceId, projectId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const query = { workspaceId };
    
    if (projectId) {
      query.projectId = projectId;
    } else {
      query.projectId = null;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching messages failed' });
  }
};
