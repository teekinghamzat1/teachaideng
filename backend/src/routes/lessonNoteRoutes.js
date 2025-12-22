const express = require('express');
const router = express.Router();
const {
    createNote,
    getNotes,
    getNoteById,
    deleteNote,
} = require('../controllers/lessonNoteController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createNote)
    .get(protect, getNotes);

router.route('/:id')
    .get(protect, getNoteById)
    .delete(protect, deleteNote);

module.exports = router;
