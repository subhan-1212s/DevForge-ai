const express = require('express');
const router = express.Router();
const { createTask, getProjectTasks, updateTask, addTaskComment, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .post(protect, createTask)
  .get(protect, getProjectTasks);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route('/:id/comment')
  .post(protect, addTaskComment);

module.exports = router;
