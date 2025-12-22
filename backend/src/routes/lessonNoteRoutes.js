const express = require('express');
const router = express.Router();
const {
    createNote,
    getNotes,
    getNoteById,
    deleteNote,
    emailNote,
} = require('../controllers/lessonNoteController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createNote)
    .get(protect, getNotes);

router.route('/:id')
    .get(protect, getNoteById)
    .delete(protect, deleteNote);

router.post('/:id/email', protect, emailNote);

module.exports = router;
