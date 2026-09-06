const express = require('express');
const router = express.Router();
const {
  createProject,
  getWorkspaceProjects,
  getProjectDetails,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect, checkWorkspaceRole } = require('../middlewares/auth');

router.route('/')
  .post(protect, checkWorkspaceRole(['owner', 'admin', 'developer']), createProject)
  .get(protect, getWorkspaceProjects);

router.route('/:id')
  .get(protect, getProjectDetails)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;
