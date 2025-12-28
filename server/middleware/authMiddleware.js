import jwt from 'jsonwebtoken';
import { User, Admin } from '../models/index.js';
import logger from '../utils/logger.js';

// Basic auth middleware - requires valid user
export const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin middleware - requires admin user
export const requireAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Check if user is in Admin collection
        const adminRecord = await Admin.findOne({ email: user.email });
        if (!adminRecord) {
            return res.status(403).json({ error: 'Admin record not found' });
        }

        req.user = user;
        req.adminRecord = adminRecord;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Main admin middleware (for critical settings)
export const requireMainAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ error: 'No valid token provided' });
        }

        console.log('Verifying token:', token.substring(0, 20) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully for user:', decoded.email);

        const user = await User.findById(decoded.id);

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        // Check if user is in Admin collection (for settings access, any admin should work)
        const adminRecord = await Admin.findOne({ email: user.email });
        if (!adminRecord) {
            return res.status(403).json({ error: 'Access denied. Admin record not found.' });
        }

        console.log('Admin access granted for:', user.email);
        req.user = user;
        req.adminRecord = adminRecord;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token format' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(401).json({ error: 'Token verification failed' });
    }
};

// Optional auth middleware - attaches user if authenticated but doesn't require it
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (token && token !== 'null' && token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail - authentication is optional
        logger.debug('Optional auth failed:', error.message);
    }
    next();
};