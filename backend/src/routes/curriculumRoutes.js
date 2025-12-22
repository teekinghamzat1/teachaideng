const express = require('express');
const router = express.Router();
const { getCurriculum, updateCurriculum } = require('../controllers/curriculumController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, getCurriculum); // Publicish (protected but for all users)
router.put('/', protect, admin, updateCurriculum);

module.exports = router;
