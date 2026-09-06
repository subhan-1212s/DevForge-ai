const express = require('express');
const router = express.Router();
const { createDocument, getProjectDocuments, getDocumentDetails, updateDocument, deleteDocument } = require('../controllers/docController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .post(protect, createDocument)
  .get(protect, getProjectDocuments);

router.route('/:id')
  .get(protect, getDocumentDetails)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

module.exports = router;
