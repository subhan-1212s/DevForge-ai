const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  updateWorkspace,
  updateMemberRole,
  removeMember,
  regenerateInviteCode,
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
  .put(protect, checkWorkspaceRole(['owner', 'admin']), updateWorkspace)
  .delete(protect, checkWorkspaceRole(['owner']), deleteWorkspace);

router.put('/:id/members/:memberId/role', protect, checkWorkspaceRole(['owner', 'admin']), updateMemberRole);
router.delete('/:id/members/:memberId', protect, checkWorkspaceRole(['owner', 'admin']), removeMember);
router.post('/:id/regenerate-invite', protect, checkWorkspaceRole(['owner', 'admin']), regenerateInviteCode);

router.post('/:id/leave', protect, checkWorkspaceRole(), leaveWorkspace);

module.exports = router;
