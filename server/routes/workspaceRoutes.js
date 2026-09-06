const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  joinWorkspace,
  leaveWorkspace,
  deleteWorkspace
} = require('../controllers/workspaceController');
const { protect, checkWorkspaceRole } = require('../middlewares/auth');

router.route('/')
  .post(protect, createWorkspace)
  .get(protect, getUserWorkspaces);

router.post('/join', protect, joinWorkspace);

router.route('/:id')
  .get(protect, checkWorkspaceRole(), getWorkspaceDetails)
  .delete(protect, checkWorkspaceRole(['owner']), deleteWorkspace);

router.post('/:id/leave', protect, checkWorkspaceRole(), leaveWorkspace);

module.exports = router;
