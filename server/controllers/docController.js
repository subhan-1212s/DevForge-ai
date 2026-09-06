const Document = require('../models/Document');

// Create Document
exports.createDocument = async (req, res) => {
  try {
    const { title, content, projectId, workspaceId } = req.body;

    if (!title || !projectId || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Title, project, and workspace IDs are required' });
    }

    const doc = await Document.create({
      title,
      content: content || '',
      author: req.user._id,
      projectId,
      workspaceId
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Creating document failed' });
  }
};

// Get Project Documents
exports.getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID query parameter is required' });
    }

    const docs = await Document.find({ projectId }).populate('author', 'name email avatar');
    res.status(200).json({ success: true, documents: docs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching documents failed' });
  }
};

// Get Document Details
exports.getDocumentDetails = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate('author', 'name email avatar');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching document details failed' });
  }
};

// Update Document
exports.updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const { title, content } = req.body;

    doc.title = title !== undefined ? title : doc.title;
    doc.content = content !== undefined ? content : doc.content;

    await doc.save();

    res.status(200).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Updating document failed' });
  }
};

// Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Deleting document failed' });
  }
};
