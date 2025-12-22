const express = require('express');
const router = express.Router();
const { saveGenerated, queryGenerated, incrementUsage, deleteGenerated } = require('../controllers/cacheController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, saveGenerated);
router.get('/', protect, queryGenerated);
router.patch('/:id/usage', protect, incrementUsage);
router.delete('/:id', protect, deleteGenerated);

module.exports = router;
