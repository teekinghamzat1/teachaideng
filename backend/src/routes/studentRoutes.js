const express = require('express');
const router = express.Router();
const {
    addStudent,
    getStudents,
    deleteStudent,
} = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, addStudent)
    .get(protect, getStudents);

router.route('/:id')
    .delete(protect, deleteStudent);

module.exports = router;
