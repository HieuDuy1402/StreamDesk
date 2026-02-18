const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Sound = require('../models/Sound');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure path is correct relative to process CWD or use absolute
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        // Sanitize filename or just use timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET all sounds for current user
router.get('/', async (req, res) => {
    try {
        const sounds = await Sound.find({ userId: req.user._id });
        res.json(sounds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST sound (Upsert based on ID)
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { id, label, icon } = req.body;

        // Check track limit ONLY if it's a new track (no track ID match for this user) 
        // OR as user mentioned "maybe dont limit track limit to add more track holder"
        // We only block the upload of a FILE if they are over the limit.
        // ADMINS are exempt from this limit.
        if (req.file && req.user.role !== 'admin') {
            const existingTrack = await Sound.findOne({ id, userId: req.user._id });
            const isReplacingFile = existingTrack && existingTrack.file;

            if (!isReplacingFile) {
                const trackCount = await Sound.countDocuments({ userId: req.user._id, file: { $exists: true, $ne: null } });
                if (trackCount >= req.user.maxTracks) {
                    return res.status(400).json({
                        error: `Max audio tracksReached (${req.user.maxTracks}). You can still save labels/icons, but cannot upload more audio files.`
                    });
                }
            }
        }

        let updateData = { label, icon, userId: req.user._id };

        // If a file was uploaded, include it
        if (req.file) {
            // Check if there's an existing sound with a file (for this user)
            const existingSound = await Sound.findOne({ id, userId: req.user._id });
            if (existingSound && existingSound.file) {
                // Delete the old file
                const fs = require('fs');
                const oldFilePath = path.join(__dirname, '..', existingSound.file.substring(1));

                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.error('Error deleting old file:', err);
                    }
                });
            }

            updateData.file = `/uploads/${req.file.filename}`;
        }

        // Find and Update or Create
        const sound = await Sound.findOneAndUpdate(
            { id, userId: req.user._id },
            updateData,
            { new: true, upsert: true }
        );

        res.json(sound);
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE sound
router.delete('/:id', async (req, res) => {
    try {
        // Find the sound first to get the file path (only for this user)
        const sound = await Sound.findOne({ id: req.params.id, userId: req.user._id });

        if (!sound) {
            return res.status(404).json({ error: 'Sound not found' });
        }

        if (sound.file) {
            // Delete the physical file
            const fs = require('fs');
            // sound.file is like "/uploads/filename.mp3", we need to prepend just "server"
            const filePath = path.join(__dirname, '..', sound.file.substring(1)); // Remove leading slash

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
            });
        }

        // Delete from database
        await Sound.deleteOne({ id: req.params.id, userId: req.user._id });
        res.json({ message: 'Sound deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
