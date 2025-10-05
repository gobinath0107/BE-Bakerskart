const express = require('express');
const router = express.Router();
const { getAllAdmins, updateAdmin, deleteAdmin, getAdminById } = require('../controllers/AdminController');

router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;