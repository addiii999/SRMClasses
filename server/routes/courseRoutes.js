const express = require('express');
const router = express.Router();
const { getCourses, getAllCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', getCourses);                            // public
router.get('/all', adminProtect, getAllCourses);        // admin
router.post('/', adminProtect, createCourse);
router.put('/:id', adminProtect, updateCourse);
router.delete('/:id', adminProtect, deleteCourse);

module.exports = router;
