const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users with stats
router.get('/users', async (req, res) => {
    try {
        const Sound = require('../models/Sound');
        const fs = require('fs');
        const path = require('path');

        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Enhance each user with stats
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const sounds = await Sound.find({ userId: u._id });
            const trackCount = sounds.filter(s => s.file).length;

            let totalStorageBytes = 0;
            sounds.forEach(s => {
                if (s.file) {
                    const filePath = path.join(__dirname, '..', s.file);
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        totalStorageBytes += stats.size;
                    }
                }
            });

            return {
                ...u.toObject(),
                trackCount,
                totalStorageBytes
            };
        }));

        res.json(usersWithStats);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update username
router.put('/users/:id/username', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({ error: 'Username must be at least 2 characters' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Update user role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update track limit
router.put('/users/:id/limit', async (req, res) => {
    try {
        const { maxTracks } = req.body;

        if (typeof maxTracks !== 'number' || maxTracks < 0) {
            return res.status(400).json({ error: 'Invalid track limit' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { maxTracks },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error updating limit:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete all tracks for a user
router.delete('/users/:id/tracks', async (req, res) => {
    try {
        const Sound = require('../models/Sound');
        const fs = require('fs');
        const path = require('path');

        const sounds = await Sound.find({ userId: req.params.id });

        // Delete physical files
        for (const sound of sounds) {
            if (sound.file) {
                const filePath = path.join(__dirname, '..', sound.file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Delete from DB
        await Sound.deleteMany({ userId: req.params.id });

        res.json({ message: 'All tracks deleted successfully' });
    } catch (err) {
        console.error('Error deleting user tracks:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset user password
router.put('/users/:id/password', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // TODO: Also delete all sounds associated with this user
        const Sound = require('../models/Sound');
        await Sound.deleteMany({ userId: req.params.id });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
