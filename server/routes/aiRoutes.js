const express = require('express');
const router = express.Router();
const { review, optimize, explainBug, generateTasks, generateCommit, askAssistant } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

router.post('/review', protect, review);
router.post('/optimize', protect, optimize);
router.post('/explain-bug', protect, explainBug);
router.post('/generate-tasks', protect, generateTasks);
router.post('/commit', protect, generateCommit);
router.post('/assistant', protect, askAssistant);

module.exports = router;
