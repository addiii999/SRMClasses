const express = require('express');
const router = express.Router();
const { 
    getDeletedItems, 
    restoreItem, 
    permanentlyDeleteItem 
} = require('../controllers/recycleBinController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/', getDeletedItems);
router.patch('/restore/:type/:id', restoreItem);
router.delete('/permanent/:type/:id', permanentlyDeleteItem);

module.exports = router;
