const express = require('express');
const router = express.Router();
const { createBug, getProjectBugs, updateBug, deleteBug } = require('../controllers/bugController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .post(protect, createBug)
  .get(protect, getProjectBugs);

router.route('/:id')
  .put(protect, updateBug)
  .delete(protect, deleteBug);

module.exports = router;
