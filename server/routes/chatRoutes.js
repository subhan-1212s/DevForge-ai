const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .post(protect, sendMessage)
  .get(protect, getMessages);

module.exports = router;
