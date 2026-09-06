const aiService = require('../services/aiService');

exports.review = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code snippet is required' });
    }
    const result = await aiService.reviewCode(code);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Review failed' });
  }
};

exports.optimize = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code snippet is required' });
    }
    const result = await aiService.optimizeCode(code);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Optimization failed' });
  }
};

exports.explainBug = async (req, res) => {
  try {
    const { errorLog } = req.body;
    if (!errorLog) {
      return res.status(400).json({ success: false, message: 'Error log/stack trace is required' });
    }
    const result = await aiService.explainBug(errorLog);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Bug Explanation failed' });
  }
};

exports.generateTasks = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt query is required' });
    }
    const result = await aiService.generateTasks(prompt);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Task Generation failed' });
  }
};

exports.generateCommit = async (req, res) => {
  try {
    const { diff } = req.body;
    if (!diff) {
      return res.status(400).json({ success: false, message: 'Diff text is required' });
    }
    const result = await aiService.generateCommitMessage(diff);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Commit Generation failed' });
  }
};

exports.askAssistant = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const response = await aiService.askAssistant(query);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI Assistant failed' });
  }
};
