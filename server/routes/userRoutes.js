import express from 'express';
import { User } from '../models/index.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * User Profile Management Routes
 * All routes require authentication via requireAuth middleware
 */

/**
 * POST /api/profile - Update user profile
 * @auth Required
 * @body {string} email - User email
 * @body {string} mName - User display name
 * @body {string} password - New password (optional, empty string to skip)
 * @body {string} uid - User ID
 */
router.post('/profile', requireAuth, async (req, res) => {
    const { email, mName, password, uid } = req.body;
    
    try {
        // Verify user is updating their own profile
        if (req.user._id.toString() !== uid) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized: Cannot update another user\'s profile' 
            });
        }

        // Validate input
        if (!email || !mName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and name are required' 
            });
        }

        // Check if email is being changed and if it's already in use
        if (email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already in use' 
                });
            }
        }

        // Update profile based on whether password is provided
        if (!password || password === '') {
            await User.findOneAndUpdate(
                { _id: uid },
                { $set: { email: email, mName: mName } }
            );
        } else {
            // TODO: Hash password before storing
            await User.findOneAndUpdate(
                { _id: uid },
                { $set: { email: email, mName: mName, password: password } }
            );
        }

        logger.info(`Profile updated for user: ${uid}`);
        
        res.json({ 
            success: true, 
            message: 'Profile Updated' 
        });
    } catch (error) {
        logger.error(`Profile update error: ${error.message}`, {
            error: error.stack,
            userId: uid
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * GET /api/profile/:userId - Get user profile information
 * @auth Required
 * @param {string} userId - User ID
 */
router.get('/profile/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Verify user is accessing their own profile (or is admin)
        if (req.user._id.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized: Cannot access another user\'s profile' 
            });
        }

        const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            user: user 
        });
    } catch (error) {
        logger.error(`Get profile error: ${error.message}`, {
            error: error.stack,
            userId
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * DELETE /api/profile/:userId - Delete user account
 * @auth Required
 * @param {string} userId - User ID
 */
router.delete('/profile/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Verify user is deleting their own account
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized: Cannot delete another user\'s account' 
            });
        }

        const deletedUser = await User.findOneAndDelete({ _id: userId });

        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Import models dynamically to avoid circular dependencies
        const { Course, Subscription } = await import('../models/index.js');

        // Delete associated data
        await Course.deleteMany({ user: userId });
        await Subscription.deleteMany({ user: userId });

        logger.info(`User account deleted: ${userId}`);

        // Clear auth cookie
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ 
            success: true, 
            message: 'Profile deleted successfully' 
        });
    } catch (error) {
        logger.error(`Delete profile error: ${error.message}`, {
            error: error.stack,
            userId
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

export default router;