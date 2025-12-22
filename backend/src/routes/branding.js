const express = require('express');
const router = express.Router();
const { getBrandingSettings } = require('../controllers/brandingController');

router.get('/', getBrandingSettings);

module.exports = router;
