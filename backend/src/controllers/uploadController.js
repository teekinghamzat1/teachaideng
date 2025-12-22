const asyncHandler = require('express-async-handler');
const { uploadToCloudinary } = require('../services/fileService');
const formatResponse = require('../utils/formatResponse');

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // If using memory storage (buffer)
    if (req.file.buffer) {
        try {
            const result = await uploadToCloudinary(req.file.buffer);
            res.json(
                formatResponse(true, 'Image uploaded', {
                    url: result.secure_url,
                    public_id: result.public_id,
                })
            );
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            res.status(500).json(formatResponse(false, 'Image upload failed', { error: error.message || String(error) }));
            return;
        }
    } else {
        // If using disk storage, you'd upload from path: req.file.path
        // For now assuming memory storage as per middleware
        res.status(400);
        throw new Error('File buffer not found');
    }
});

// @desc    Upload file
// @route   POST /api/upload/file
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
    // Same logic as image for now, but could have different validation/folder
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    if (req.file.buffer) {
        try {
            const result = await uploadToCloudinary(req.file.buffer);
            res.json(
                formatResponse(true, 'File uploaded', {
                    url: result.secure_url,
                    public_id: result.public_id,
                })
            );
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            res.status(500).json(formatResponse(false, 'File upload failed', { error: error.message || String(error) }));
            return;
        }
    } else {
        res.status(400);
        throw new Error('File buffer not found');
    }
});

module.exports = {
    uploadImage,
    uploadFile,
};
