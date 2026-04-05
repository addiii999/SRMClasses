const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const { adminProtect } = require('../middleware/adminAuth');

// Public route to list active branches (can be used by frontend)
router.get('/', getBranches);

// Admin protected routes for managing branches
router.post('/', adminProtect, createBranch);
router.put('/:id', adminProtect, updateBranch);
router.delete('/:id', adminProtect, deleteBranch);

module.exports = router;
