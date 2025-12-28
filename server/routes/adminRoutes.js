import express from 'express';
import { requireAdmin, requireMainAdmin } from '../middleware/authMiddleware.js';
import { User, Admin, Course, Contact, Blog, Settings, Subscription } from '../models/index.js';
import settingsCache from '../services/settingsCache.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Helper function to get admin emails
async function getEmailsOfAdmins() {
    const admins = await Admin.find({});
    return admins.map((admin) => admin.email);
}

// DASHBOARD STATISTICS
router.post('/dashboard', async (req, res) => {
    const users = await User.estimatedDocumentCount();
    const courses = await Course.estimatedDocumentCount();
    const admin = await Admin.findOne({ type: 'main' });
    const total = admin.total;
    const monthlyPlanCount = await User.countDocuments({
        type: process.env.MONTH_TYPE
    });
    const yearlyPlanCount = await User.countDocuments({
        type: process.env.YEAR_TYPE
    });
    let monthCost = monthlyPlanCount * process.env.MONTH_COST;
    let yearCost = yearlyPlanCount * process.env.YEAR_COST;
    let sum = monthCost + yearCost;
    let paid = yearlyPlanCount + monthlyPlanCount;
    const videoType = await Course.countDocuments({
        type: 'video & text course'
    });
    const textType = await Course.countDocuments({
        type: 'theory & image course'
    });
    let free = users - paid;
    res.json({
        users: users,
        courses: courses,
        total: total,
        sum: sum,
        paid: paid,
        videoType: videoType,
        textType: textType,
        free: free,
        admin: admin
    });
});

// GET ALL USERS (with pagination)
router.get('/getusers', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search
            ? {
                  $or: [
                      { mName: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { type: { $regex: search, $options: 'i' } }
                  ]
              }
            : {};

        const users = await User.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: -1 });

        const total = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET ALL COURSES (with pagination)
router.get('/getcourses', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search
            ? {
                  $or: [
                      { mainTopic: { $regex: search, $options: 'i' } },
                      { user: { $regex: search, $options: 'i' } },
                      { type: { $regex: search, $options: 'i' } }
                  ]
              }
            : {};

        const courses = await Course.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Course.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);

        res.json({
            courses,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET PAID USERS (with pagination)
router.get('/getpaid', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query for paid users
        const searchQuery = {
            type: { $ne: 'free' },
            ...(search && {
                $or: [
                    { mName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { type: { $regex: search, $options: 'i' } }
                ]
            })
        };

        const paidUsers = await User.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: -1 });

        const total = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);

        res.json({
            users: paidUsers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET ADMIN SETTINGS
router.get('/admin/settings', requireMainAdmin, async (req, res) => {
    try {
        const settings = await Settings.find({});
        const settingsMap = {};

        // Convert to key-value pairs and mask secrets
        settings.forEach((setting) => {
            settingsMap[setting.key] = {
                value: setting.isSecret ? '••••••••' : setting.value,
                category: setting.category,
                isSecret: setting.isSecret
            };
        });

        // Add env defaults for missing settings
        const defaultSettings = {
            API_KEY: { value: '••••••••', category: 'ai', isSecret: true },
            EMAIL: {
                value: process.env.EMAIL || '',
                category: 'email',
                isSecret: false
            },
            PASSWORD: { value: '••••••••', category: 'email', isSecret: true },
            LOGO: {
                value: process.env.LOGO || '',
                category: 'branding',
                isSecret: false
            },
            COMPANY: {
                value: process.env.COMPANY || '',
                category: 'branding',
                isSecret: false
            },
            GOOGLE_CLIENT_ID: {
                value: process.env.GOOGLE_CLIENT_ID || '',
                category: 'social',
                isSecret: true
            },
            FACEBOOK_CLIENT_ID: {
                value: process.env.FACEBOOK_CLIENT_ID || '',
                category: 'social',
                isSecret: true
            },
            GOOGLE_LOGIN_ENABLED: {
                value: process.env.GOOGLE_LOGIN_ENABLED || 'true',
                category: 'social',
                isSecret: false
            },
            FACEBOOK_LOGIN_ENABLED: {
                value: process.env.FACEBOOK_LOGIN_ENABLED || 'true',
                category: 'social',
                isSecret: false
            }
        };

        // Merge with defaults
        Object.keys(defaultSettings).forEach((key) => {
            if (!settingsMap[key]) {
                settingsMap[key] = defaultSettings[key];
            }
        });

        res.json(settingsMap);
    } catch (error) {
        console.error('Settings fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE ADMIN SETTING
router.put('/admin/settings/:key', requireMainAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        // Validate allowed keys
        const allowedKeys = [
            'API_KEY',
            'EMAIL',
            'PASSWORD',
            'LOGO',
            'COMPANY',
            'GOOGLE_CLIENT_ID',
            'FACEBOOK_CLIENT_ID',
            'GOOGLE_LOGIN_ENABLED',
            'FACEBOOK_LOGIN_ENABLED'
        ];
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: 'Invalid setting key' });
        }

        // Basic validation
        if (!value || value.trim() === '') {
            return res.status(400).json({ error: 'Value cannot be empty' });
        }

        // Update or create setting
        const isSecret = ['API_KEY', 'PASSWORD', 'GOOGLE_CLIENT_ID', 'FACEBOOK_CLIENT_ID'].includes(key);
        let category = 'general';
        if (key === 'API_KEY') category = 'ai';
        else if (key.includes('EMAIL') || key.includes('PASSWORD')) category = 'email';
        else if (key.includes('LOGO') || key.includes('COMPANY')) category = 'branding';
        else if (key.includes('GOOGLE') || key.includes('FACEBOOK')) category = 'social';

        await Settings.findOneAndUpdate(
            { key },
            {
                value: value.trim(),
                category,
                isSecret,
                updatedBy: req.user._id,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Clear cache and log
        settingsCache.invalidate(key);
        logger.info(`Setting ${key} updated by ${req.user.email}`);
        
        res.json({ success: true, message: 'Setting updated successfully' });
    } catch (error) {
        logger.error('Settings update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET ADMINS AND NON-ADMIN USERS
router.get('/getadmins', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const adminEmails = await getEmailsOfAdmins();

        // Build search query for non-admin users
        const userSearchQuery = {
            email: { $nin: adminEmails },
            ...(search && {
                $or: [
                    { mName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { type: { $regex: search, $options: 'i' } }
                ]
            })
        };

        // Build search query for admins
        const adminSearchQuery = search
            ? {
                  $or: [
                      { mName: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { type: { $regex: search, $options: 'i' } }
                  ]
              }
            : {};

        const users = await User.find(userSearchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: -1 });

        const admins = await Admin.find(adminSearchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: -1 });

        const totalUsers = await User.countDocuments(userSearchQuery);
        const totalAdmins = await Admin.countDocuments(adminSearchQuery);
        const totalUsersPages = Math.ceil(totalUsers / limit);
        const totalAdminsPages = Math.ceil(totalAdmins / limit);

        res.json({
            users,
            admins,
            pagination: {
                users: {
                    currentPage: parseInt(page),
                    totalPages: totalUsersPages,
                    totalItems: totalUsers,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalUsersPages,
                    hasPrevPage: page > 1
                },
                admins: {
                    currentPage: parseInt(page),
                    totalPages: totalAdminsPages,
                    totalItems: totalAdmins,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalAdminsPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        logger.error('Get admins error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ADD ADMIN
router.post('/addadmin', requireAdmin, async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            user.isAdmin = true;
            await user.save();
        }

        const paidUser = await Subscription.findOne({ user: user._id });
        if (!paidUser) {
            await User.findOneAndUpdate(
                { email: email },
                { $set: { type: 'forever' } }
            );
        }
        
        const newAdmin = new Admin({
            email: user.email,
            mName: user.mName,
            type: 'no'
        });
        await newAdmin.save();
        
        logger.info(`Admin added: ${email} by ${req.user.email}`);
        res.json({ success: true, message: 'Admin added successfully' });
    } catch (error) {
        logger.error('Add admin error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// REMOVE ADMIN
router.post('/removeadmin', requireAdmin, async (req, res) => {
    const { email } = req.body;
    try {
        await Admin.findOneAndDelete({ email: email });
        const user = await User.findOne({ email: email });
        if (user) {
            user.isAdmin = false;
            if (user.type === 'forever') {
                user.type = 'free';
            }
            await user.save();
        }
        
        logger.info(`Admin removed: ${email} by ${req.user.email}`);
        res.json({ success: true, message: 'Admin removed successfully' });
    } catch (error) {
        logger.error('Remove admin error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET CONTACTS (with pagination)
router.get('/getcontact', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search
            ? {
                  $or: [
                      { fname: { $regex: search, $options: 'i' } },
                      { lname: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { msg: { $regex: search, $options: 'i' } }
                  ]
              }
            : {};

        const contacts = await Contact.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Contact.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);

        res.json({
            contacts,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        logger.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// SAVE ADMIN POLICIES (terms, privacy, cancel, refund, billing)
router.post('/saveadmin', async (req, res) => {
    const { data, type } = req.body;
    try {
        const updateField = {};
        updateField[type] = data;

        if (['terms', 'privacy', 'cancel', 'refund', 'billing'].includes(type)) {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: updateField }
            );
            
            logger.info(`Admin policy updated: ${type}`);
            res.json({ success: true, message: 'Saved successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid policy type' });
        }
    } catch (error) {
        logger.error('Save admin policy error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET POLICIES
router.get('/policies', async (req, res) => {
    try {
        const admins = await Admin.find({});
        res.json(admins);
    } catch (error) {
        logger.error('Get policies error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// CREATE BLOG
router.post('/createblog', requireAdmin, async (req, res) => {
    try {
        const {
            title,
            excerpt,
            content,
            image,
            category,
            tags,
            popular,
            featured
        } = req.body;
        
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        const blogs = new Blog({
            title,
            excerpt,
            content,
            image: buffer,
            category,
            tags,
            popular,
            featured
        });
        await blogs.save();
        
        logger.info(`Blog created: ${title} by ${req.user.email}`);
        res.json({ success: true, message: 'Blog created successfully' });
    } catch (error) {
        logger.error('Create blog error:', error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

// DELETE BLOG
router.post('/deleteblogs', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findOneAndDelete({ _id: id });
        
        if (blog) {
            logger.info(`Blog deleted: ${blog.title} by ${req.user.email}`);
        }
        
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        logger.error('Delete blog error:', error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

// UPDATE BLOG (popular/featured status)
router.post('/updateblogs', requireAdmin, async (req, res) => {
    try {
        const { id, type, value } = req.body;
        const booleanValue = value === 'true' ? true : false;
        
        const updateField = {};
        updateField[type] = booleanValue;

        if (type === 'popular' || type === 'featured') {
            await Blog.findOneAndUpdate(
                { _id: id },
                { $set: updateField }
            );
            
            logger.info(`Blog ${type} status updated: ${id} = ${booleanValue} by ${req.user.email}`);
            res.json({ success: true, message: 'Blog updated successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid update type' });
        }
    } catch (error) {
        logger.error('Update blog error:', error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

// GET BLOGS (Admin - with pagination)
router.get('/getblogs', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search
            ? {
                  $or: [
                      { title: { $regex: search, $options: 'i' } },
                      { excerpt: { $regex: search, $options: 'i' } },
                      { category: { $regex: search, $options: 'i' } },
                      { tags: { $regex: search, $options: 'i' } }
                  ]
              }
            : {};

        const blogs = await Blog.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Blog.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);

        res.json({
            blogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        logger.error('Get blogs error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router;