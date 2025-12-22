const express = require('express');
const router = express.Router();
const { uploadImage, uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadMemory } = require('../middlewares/uploadMiddleware');

router.post('/image', protect, uploadMemory.single('image'), uploadImage);
router.post('/file', protect, uploadMemory.single('file'), uploadFile);

module.exports = router;
