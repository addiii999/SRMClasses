const express = require('express');
const router = express.Router();
const { 
    getDeletedItems, 
    restoreItem, 
    permanentlyDeleteItem 
} = require('../controllers/recycleBinController');
const { adminProtect } = require('../middleware/adminAuth');

router.use(adminProtect);

router.get('/', getDeletedItems);
router.patch('/restore/:type/:id', restoreItem);
router.delete('/permanent/:type/:id', permanentlyDeleteItem);

module.exports = router;
