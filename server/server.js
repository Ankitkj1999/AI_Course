// IMPORT
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import gis from 'g-i-s';
import youtubesearchapi from 'youtube-search-api';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { createApi } from 'unsplash-js';
import showdown from 'showdown';
import axios from 'axios';
import Stripe from 'stripe';
import Flutterwave from 'flutterwave-node-v3';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { generateSlug, generateUniqueSlug, extractTitleFromContent } from './utils/slugify.js';
import Settings from './models/Settings.js';
import settingsCache from './services/settingsCache.js';
import { generateCourseSEO } from './utils/seo.js';
import { getServerPort, getServerURL, validateConfig } from './utils/config.js';

// Load environment variables
dotenv.config();

// Validate configuration
validateConfig();

// Initialize services that need config
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);

//INITIALIZE
const app = express();

// Configure CORS - Simplified for Docker setup
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost origins in development
        if (process.env.NODE_ENV !== 'production') {
            const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
            if (localhostRegex.test(origin)) {
                logger.info(`CORS: Allowing development origin: ${origin}`);
                return callback(null, true);
            }
        }
        
        // Get allowed origins from environment or use defaults
        const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
        
        const allowedOrigins = [
            process.env.WEBSITE_URL,
            `http://localhost:${process.env.PORT}`,
            `https://localhost:${process.env.PORT}`,
            'http://localhost:5010',
            'https://localhost:5010',
            // Production domains
            'https://gksage.com',
            'https://www.gksage.com',
            'http://gksage.com',
            'http://www.gksage.com',
            // Additional origins from environment
            ...envOrigins,
        ].filter(Boolean);
        
        // Also allow any localhost origin and production domains
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        const isProductionDomain = /^https?:\/\/(www\.)?gksage\.com$/.test(origin);
        
        if (allowedOrigins.includes(origin) || isLocalhost || isProductionDomain) {
            logger.info(`CORS: Allowing origin: ${origin}`);
            callback(null, true);
        } else {
            logger.warn(`CORS: Blocked origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

const PORT = process.env.PORT;
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
mongoose.connect(process.env.MONGODB_URI);
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: 'gmail',
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});
// Dynamic AI instance getter
const getAI = async () => {
    const apiKey = await settingsCache.get('API_KEY');
    return new GoogleGenerativeAI(apiKey);
};
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

//SCHEMA
const adminSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    mName: String,
    type: { type: String, required: true },
    total: { type: Number, default: 0 },
    terms: { type: String, default: '' },
    privacy: { type: String, default: '' },
    cancel: { type: String, default: '' },
    refund: { type: String, default: '' },
    billing: { type: String, default: '' }
});
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    mName: String,
    password: String,
    type: String,
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
});
const courseSchema = new mongoose.Schema({
    user: String,
    content: { type: String, required: true },
    type: String,
    mainTopic: String,
    slug: { type: String, unique: true, index: true },
    photo: String,
    date: { type: Date, default: Date.now },
    end: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false }
});
const subscriptionSchema = new mongoose.Schema({
    user: String,
    subscription: String,
    subscriberId: String,
    plan: String,
    method: String,
    date: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
});
const contactShema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    phone: Number,
    msg: String,
    date: { type: Date, default: Date.now },
});
const notesSchema = new mongoose.Schema({
    course: String,
    notes: String,
});
const examSchema = new mongoose.Schema({
    course: String,
    exam: String,
    marks: String,
    passed: { type: Boolean, default: false },
});
const langSchema = new mongoose.Schema({
    course: String,
    lang: String,
});
const blogSchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true },
    excerpt: String,
    category: String,
    tags: String,
    content: String,
    image: {
        type: Buffer,
        required: true
    },
    popular: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    format: { type: String, default: 'mixed' },
    content: { type: String, required: true }, // Quiz questions in markdown format
    tokens: {
        prompt: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    viewCount: { type: Number, default: 0 },
    lastVisitedAt: { type: Date, default: Date.now },
    questionAndAnswers: [{ // Pre-quiz questions for customization
        role: { type: String, enum: ['assistant', 'user'] },
        question: String,
        answer: String,
        possibleAnswers: [String]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const flashcardSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true }, // Flashcards in markdown format
    cards: [{
        front: { type: String, required: true },
        back: { type: String, required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        tags: [String]
    }],
    tokens: {
        prompt: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    viewCount: { type: Number, default: 0 },
    lastVisitedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const guideSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true }, // Guide content in markdown format
    relatedTopics: [String], // Array of related topic suggestions
    deepDiveTopics: [String], // Array of advanced topics for further study
    questions: [String], // Array of study questions
    tokens: {
        prompt: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    viewCount: { type: Number, default: 0 },
    lastVisitedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

//MODEL
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Contact = mongoose.model('Contact', contactShema);
const Admin = mongoose.model('Admin', adminSchema);
const NotesSchema = mongoose.model('Notes', notesSchema);
const ExamSchema = mongoose.model('Exams', examSchema);
const LangSchema = mongoose.model('Lang', langSchema);
const BlogSchema = mongoose.model('Blog', blogSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);
const Guide = mongoose.model('Guide', guideSchema);

// MIDDLEWARE DEFINITIONS

// Basic auth middleware - requires valid user
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
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
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
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
const requireMainAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
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

//REQUEST

//HEALTH CHECK
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Check AI service (optional - can be slow)
        let aiStatus = 'unknown';
        try {
            const genAI = await getAI();
            const testModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            await testModel.generateContent("test");
            aiStatus = 'connected';
        } catch (error) {
            aiStatus = 'error';
        }

        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            services: {
                database: dbStatus,
                ai: aiStatus
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

//SIGNUP
app.post('/api/signup', async (req, res) => {
    const { email, mName, password, type } = req.body;

    try {
        const estimate = await User.estimatedDocumentCount();
        if (estimate > 0) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.json({ success: false, message: 'User with this email already exists' });
            }
            const newUser = new User({ email, mName, password, type });
            await newUser.save();
            res.json({ success: true, message: 'Account created successfully', userId: newUser._id });
        } else {
            const newUser = new User({ email, mName, password, type: 'forever', isAdmin: true });
            await newUser.save();
            const newAdmin = new Admin({ email, mName, type: 'main' });
            await newAdmin.save();
            res.json({ success: true, message: 'Account created successfully', userId: newUser._id });
        }
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//SIGNIN
app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        if (password === user.password) {
            try {
                // Generate JWT token
                console.log('Generating JWT token for user:', user.email);
                console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
                
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );
                
                console.log('Token generated successfully:', !!token);
                
                return res.json({ 
                    success: true, 
                    message: 'SignIn Successful', 
                    token,
                    userData: { ...user.toObject(), isAdmin: user.isAdmin } 
                });
            } catch (error) {
                console.error('JWT generation error:', error);
                return res.json({ 
                    success: true, 
                    message: 'SignIn Successful', 
                    userData: { ...user.toObject(), isAdmin: user.isAdmin } 
                });
            }
        }

        res.json({ success: false, message: 'Invalid email or password' });

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Invalid email or password' });
    }

});

//SIGNINSOCIAL
app.post('/api/social', async (req, res) => {
    const { email, name } = req.body;
    let mName = name;
    let password = '';
    let type = 'free';
    try {
        const user = await User.findOne({ email });

        if (!user) {
            const estimate = await User.estimatedDocumentCount();
            if (estimate > 0) {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();
                
                const token = jwt.sign(
                    { id: newUser._id, email: newUser.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );
                
                res.json({ success: true, message: 'Account created successfully', token, userData: newUser });
            } else {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();
                const newAdmin = new Admin({ email, mName, type: 'main' });
                await newAdmin.save();
                
                const token = jwt.sign(
                    { id: newUser._id, email: newUser.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );
                
                res.json({ success: true, message: 'Account created successfully', token, userData: newUser });
            }
        } else {
            const token = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({ success: true, message: 'SignIn Successful', token, userData: user });
        }

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

});

//SEND MAIL
app.post('/api/data', async (req, res) => {
    const receivedData = req.body;

    try {
        const emailHtml = receivedData.html;

        const options = {
            from: process.env.EMAIL,
            to: receivedData.to,
            subject: receivedData.subject,
            html: emailHtml,
        };

        const data = await transporter.sendMail(options);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error', error);
        res.status(400).json(error);
    }
});

//FOROGT PASSWORD
app.post('/api/forgot', async (req, res) => {
    const { email, name, company, logo } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: `${name} Password Reset`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Password Reset<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
                <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${logo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Password Reset</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Click on the button below to reset the password for your account ${email}.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                        <tbody>
                          <tr>
                            <td><a href="${resetLink}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reset</span></a></td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${company}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//FOROGT PASSWORD
app.post('/api/reset-password', async (req, res) => {
    const { password, token } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.json({ success: true, message: 'Invalid or expired token' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({ success: true, message: 'Password updated successfully', email: user.email });

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//GET DATA FROM MODEL
app.post('/api/prompt', requireAuth, async (req, res) => {
    const receivedData = req.body;

    const promptString = receivedData.prompt;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    const genAI = await getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

    const prompt = promptString;

    await model.generateContent(prompt).then(result => {
        const response = result.response;
        const generatedText = response.text();
        res.status(200).json({ generatedText });
    }).catch(error => {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })
});

//GET GENERATE THEORY
app.post('/api/generate', requireAuth, async (req, res) => {
    const receivedData = req.body;

    const promptString = receivedData.prompt;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    const genAI = await getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

    const prompt = promptString

    await model.generateContent(prompt).then(result => {
        const response = result.response;
        const txt = response.text();
        // Store raw markdown instead of converting to HTML for better formatting
        const text = txt;
        res.status(200).json({ 
            text,
            contentType: 'markdown' // Add content type for frontend detection
        });
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })

});

//GET IMAGE
app.post('/api/image', async (req, res) => {
    const receivedData = req.body;
    const promptString = receivedData.prompt;
    gis(promptString, logResults);
    function logResults(error, results) {
        if (error) {
            //ERROR
            console.log('Error', error);
        }
        else {
            res.status(200).json({ url: results[0].url });
        }
    }
})

//GET VIDEO 
app.post('/api/yt', async (req, res) => {
    try {

        const receivedData = req.body;
        const promptString = receivedData.prompt;
        const video = await youtubesearchapi.GetListByKeyword(promptString, [false], [1], [{ type: 'video' }])
        const videoId = await video.items[0].id;
        res.status(200).json({ url: videoId });

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//GET TRANSCRIPT 
app.post('/api/transcript', async (req, res) => {
    const receivedData = req.body;
    const promptString = receivedData.prompt;
    YoutubeTranscript.fetchTranscript(promptString).then(video => {
        res.status(200).json({ url: video });
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })
});

//STORE COURSE
app.post('/api/course', requireAuth, async (req, res) => {
    const { user, content, type, mainTopic, lang } = req.body;

    unsplash.search.getPhotos({
        query: mainTopic,
        page: 1,
        perPage: 1,
        orientation: 'landscape',
    }).then(async (result) => {
        const photos = result.response.results;
        const photo = photos && photos.length > 0 ? photos[0].urls.regular : null;
        try {
            // Generate SEO-friendly slug
            const title = extractTitleFromContent(content, mainTopic);
            const slug = await generateUniqueSlug(title, Course);
            
            const newCourse = new Course({ user, content, type, mainTopic, slug, photo });
            await newCourse.save();
            const newLang = new LangSchema({ course: newCourse._id, lang: lang });
            await newLang.save();
            
            logger.info(`Course created: ${newCourse._id} with slug: ${slug}`);
            res.json({ 
                success: true, 
                message: 'Course created successfully', 
                courseId: newCourse._id,
                slug: slug
            });
        } catch (error) {
            logger.error(`Course creation error: ${error.message}`, { error: error.stack, user, mainTopic });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })
});

//STORE COURSE SHARED
app.post('/api/courseshared', requireAuth, async (req, res) => {
    const { user, content, type, mainTopic } = req.body;

    unsplash.search.getPhotos({
        query: mainTopic,
        page: 1,
        perPage: 1,
        orientation: 'landscape',
    }).then(async (result) => {
        const photos = result.response.results;
        const photo = photos && photos.length > 0 ? photos[0].urls.regular : null;
        try {
            // Generate SEO-friendly slug for shared course
            const title = extractTitleFromContent(content, mainTopic);
            const slug = await generateUniqueSlug(title, Course);
            
            const newCourse = new Course({ user, content, type, mainTopic, slug, photo });
            await newCourse.save();
            
            logger.info(`Shared course created: ${newCourse._id} with slug: ${slug}`);
            res.json({ 
                success: true, 
                message: 'Course created successfully', 
                courseId: newCourse._id,
                slug: slug
            });
        } catch (error) {
            logger.error(`Shared course creation error: ${error.message}`, { error: error.stack, user, mainTopic });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    })
});

//UPDATE COURSE
app.post('/api/update', async (req, res) => {
    const { content, courseId } = req.body;
    try {

        await Course.findOneAndUpdate(
            { _id: courseId },
            [{ $set: { content: content } }]
        ).then(result => {
            res.json({ success: true, message: 'Course updated successfully' });
        }).catch(error => {
            res.status(500).json({ success: false, message: 'Internal server error' });
        })

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//DELETE COURSE
app.post('/api/deletecourse', async (req, res) => {
    const { courseId } = req.body;
    try {
        await Course.findOneAndDelete({ _id: courseId });
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/api/finish', async (req, res) => {
    const { courseId } = req.body;
    try {

        await Course.findOneAndUpdate(
            { _id: courseId },
            { $set: { completed: true, end: Date.now() } }
        ).then(result => {
            res.json({ success: true, message: 'Course completed successfully' });
        }).catch(error => {
            console.log('Error', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        })

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

});

//SEND CERTIFICATE
app.post('/api/sendcertificate', async (req, res) => {
    const { html, email } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Certification of completion',
        html: html
    };

    transporter.sendMail(options, (error, info) => {
        if (error) {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        } else {
            res.json({ success: true, message: 'Email sent successfully' });
        }
    });
});

// Backend: Modify API to handle pagination
app.get('/api/courses', async (req, res) => {
    try {
        const { userId, page = 1, limit = 9 } = req.query;
        const skip = (page - 1) * limit;

        const courses = await Course.find({ user: userId })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        res.json(courses);
    } catch (error) {
        console.log('Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//GET SHARED COURSE
app.get('/api/shareable', async (req, res) => {
    try {
        const { id } = req.query;
        await Course.find({ _id: id }).then((result) => {
            res.json(result);
        });
    } catch (error) {
        logger.error(`Get shareable course error: ${error.message}`, { error: error.stack, id });
        res.status(500).send('Internal Server Error');
    }
});

//GET COURSE BY SLUG
app.get('/api/course/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const course = await Course.findOne({ slug });
        
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }
        
        logger.info(`Course accessed by slug: ${slug}`);
        res.json({
            success: true,
            course: course
        });
    } catch (error) {
        logger.error(`Get course by slug error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

//GET COURSE BY ID (Legacy support)
app.get('/api/course/id/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }
        
        // If course has slug, redirect to slug URL
        if (course.slug) {
            return res.json({
                success: true,
                redirect: `/course/${course.slug}`,
                course: course
            });
        }
        
        logger.info(`Course accessed by ID: ${id}`);
        res.json({
            success: true,
            course: course
        });
    } catch (error) {
        logger.error(`Get course by ID error: ${error.message}`, { error: error.stack, id: req.params.id });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

//GET SEO DATA FOR COURSE
app.get('/api/seo/course/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const course = await Course.findOne({ slug });
        
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }
        
        const baseUrl = process.env.WEBSITE_URL || 'http://localhost:8080';
        const seoData = generateCourseSEO(course, baseUrl);
        
        res.json({
            success: true,
            seo: seoData
        });
    } catch (error) {
        logger.error(`Get SEO data error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

//GET PROFILE DETAILS
app.post('/api/profile', async (req, res) => {
    const { email, mName, password, uid } = req.body;
    try {

        if (password === '') {
            await User.findOneAndUpdate(
                { _id: uid },
                { $set: { email: email, mName: mName } }
            ).then(result => {
                res.json({ success: true, message: 'Profile Updated' });
            }).catch(error => {

                res.status(500).json({ success: false, message: 'Internal server error' });
            })
        } else {
            await User.findOneAndUpdate(
                { _id: uid },
                { $set: { email: email, mName: mName, password: password } }
            ).then(result => {
                res.json({ success: true, message: 'Profile Updated' });
            }).catch(error => {

                res.status(500).json({ success: false, message: 'Internal server error' });
            })
        }

    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

});

//PAYPAL PAYMENT
app.post('/api/paypal', async (req, res) => {
    const { planId, email, name, lastName, post, address, country, brand, admin } = req.body;
    try {
        const firstLine = address.split(',').slice(0, -1).join(',');
        const secondLine = address.split(',').pop();

        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
        const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
        const setSubscriptionPayload = (subscriptionPlanID) => {
            let subscriptionPayload = {
                "plan_id": subscriptionPlanID,
                "subscriber": { "name": { "given_name": name, "surname": lastName }, "email_address": email, "shipping_address": { "name": { "full_name": name }, "address": { "address_line_1": firstLine, "address_line_2": secondLine, "admin_area_2": admin, "admin_area_1": country, "postal_code": post, "country_code": country } } },
                "application_context": {
                    "brand_name": process.env.COMPANY,
                    "locale": "en-US",
                    "shipping_preference": "SET_PROVIDED_ADDRESS",
                    "user_action": "SUBSCRIBE_NOW",
                    "payment_method": {
                        "payer_selected": "PAYPAL",
                        "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                    },
                    "return_url": `${process.env.WEBSITE_URL}/payment-success/${planId}`,
                    "cancel_url": `${process.env.WEBSITE_URL}/payment-failed`
                }
            }
            return subscriptionPayload

        }

        let subscriptionPlanID = planId;
        const response = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
            method: 'POST',
            body: JSON.stringify(setSubscriptionPayload(subscriptionPlanID)),
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json'
            },
        });
        const session = await response.json();
        res.send(session)
    } catch (error) {
        console.log('Error', error);
    }
});

//GET SUBSCRIPTION DETAILS
app.post('/api/subscriptiondetail', async (req, res) => {

    try {
        const { uid, email } = req.body;

        const userDetails = await Subscription.findOne({ user: uid });
        if (userDetails.method === 'stripe') {
            const subscription = await stripe.subscriptions.retrieve(
                userDetails.subscriberId
            );

            res.json({ session: subscription, method: userDetails.method });
        } else if (userDetails.method === 'paypal') {
            const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
            const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
            const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
            const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${userDetails.subscription}`, {
                headers: {
                    'Authorization': 'Basic ' + auth,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const session = await response.json();
            res.json({ session: session, method: userDetails.method });
        }
        else if (userDetails.method === 'flutterwave') {
            const payload = { "email": email };
            const response = await flw.Subscription.get(payload);
            res.json({ session: response['data'][0], method: userDetails.method });
        }
        else if (userDetails.method === 'paystack') {
            const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
            const response = await axios.get(`https://api.paystack.co/subscription/${userDetails.subscriberId}`, {
                headers: {
                    Authorization: authorization
                }
            });

            let subscriptionDetails = null;
            subscriptionDetails = {
                subscription_code: response.data.data.subscription_code,
                createdAt: response.data.data.createdAt,
                updatedAt: response.data.data.updatedAt,
                customer_code: userDetails.subscription,
                email_token: response.data.data.email_token,
            };

            res.json({ session: subscriptionDetails, method: userDetails.method });
        }
        else {
            const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
            const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
            const SUBSCRIPTION_ID = userDetails.subscription;

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                },
                auth: {
                    username: YOUR_KEY_ID,
                    password: YOUR_KEY_SECRET
                }
            };

            axios.get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config)
                .then(response => {
                    res.json({ session: response.data, method: userDetails.method });
                })
                .catch(error => {
                    console.log(error);
                });

        }

    } catch (error) {
        console.log('Error', error);
    }

});

//GET PAYPAL DETAILS
app.post('/api/paypaldetails', async (req, res) => {

    const { subscriberId, uid, plan } = req.body;

    let cost = 0;
    if (plan === process.env.MONTH_TYPE) {
        cost = process.env.MONTH_COST
    } else {
        cost = process.env.YEAR_COST
    }
    cost = cost / 4;

    await Admin.findOneAndUpdate(
        { type: 'main' },
        { $inc: { total: cost } }
    );

    await User.findOneAndUpdate(
        { _id: uid },
        { $set: { type: plan } }
    ).then(async result => {
        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
        const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
        const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriberId}`, {
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const session = await response.json();
        res.send(session);
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })

});

//DOWNLOAD RECEIPT
app.post('/api/downloadreceipt', async (req, res) => {
    const { html, email } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Subscription Receipt',
        html: html
    };

    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log('Error', error);
            res.status(500).json({ success: false, message: 'Failed to send receipt' });
        } else {
            res.json({ success: true, message: 'Receipt sent to your mail' });
        }
    });

});

//SEND RECEIPT
app.post('/api/sendreceipt', async (req, res) => {
    const { html, email, plan, subscriberId, user, method, subscription } = req.body;
    console.log(subscriberId, subscription);
    const existingSubscription = await Subscription.findOne({ user: user });
    if (existingSubscription) {
        //DO NOTHING
    } else {
        const newSub = new Subscription({ user, subscription, subscriberId, plan, method });
        await newSub.save();
        console.log(newSub);
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Subscription Payment',
        html: html
    };

    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log('Error', error);
            res.status(500).json({ success: false, message: 'Failed to send receipt' });
        } else {
            res.json({ success: true, message: 'Receipt sent to your mail' });
        }
    });
});


//PAYPAL WEBHOOKS
app.post('/api/paypalwebhooks', async (req, res) => {

    const body = req.body;
    const event_type = body.event_type;

    switch (event_type) {
        case 'BILLING.SUBSCRIPTION.CANCELLED':
            const id = body['resource']['id'];
            updateSubsciption(id, "Cancelled");
            break;
        case 'BILLING.SUBSCRIPTION.EXPIRED':
            const id2 = body['resource']['id'];
            updateSubsciption(id2, "Expired");
            break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
            const id3 = body['resource']['id'];
            updateSubsciption(id3, "Suspended");
            break;
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
            const id4 = body['resource']['id'];
            updateSubsciption(id4, "Disabled Due To Payment Failure");
            break;
        case 'PAYMENT.SALE.COMPLETED':
            const id5 = body['resource']['billing_agreement_id'];
            sendRenewEmail(id5);
            break;

        default:
        //DO NOTHING
    }

});

//SEND RENEW EMAIL
async function sendRenewEmail(id) {
    try {
        const subscriptionDetails = await Subscription.findOne({ subscription: id });
        const userId = subscriptionDetails.user;
        const userDetails = await User.findOne({ _id: userId });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: userDetails.email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Renewed`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Renewed<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
             <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Renewed</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Renewed.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log('Error', error);
    }
}

//UPDATE SUBSCRIPTION DETIALS
async function updateSubsciption(id, subject) {
    try {
        const subscriptionDetails = await Subscription.findOne({ subscription: id });
        const userId = subscriptionDetails.user;

        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { type: 'free' } }
        );

        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscription: id });

        sendCancelEmail(userDetails.email, userDetails.mName, subject);
    } catch (error) {
        console.log('Error', error);
    }
}

//SEND CANCEL EMAIL
async function sendCancelEmail(email, name, subject) {

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const Reactivate = process.env.WEBSITE_URL + "/pricing";

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: `${name} Your Subscription Plan Has Been ${subject}`,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <html lang="en">
        
          <head></head>
         <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription ${subject}<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
         </div>
        
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
              <tr style="width:100%">
                <td>
                  <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                    <tbody>
                      <tr>
                        <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                      </tr>
                    </tbody>
                  </table>
                  <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription ${subject}</h1>
                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${name}, your subscription plan has been ${subject}. Reactivate your plan by clicking on the button below.</p>
                  <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                       <tbody>
                          <tr>
                            <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                          </tr>
                        </tbody>
                  </table>
                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                  </td>
              </tr>
            </table>
          </body>
        
        </html>`,
    };

    await transporter.sendMail(mailOptions);

}

//CANCEL PAYPAL SUBSCRIPTION
app.post('/api/paypalcancel', async (req, res) => {
    const { id, email } = req.body;

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
    await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ "reason": "Not satisfied with the service" })

    }).then(async resp => {
        try {
            const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
            const userId = subscriptionDetails.user;

            await User.findOneAndUpdate(
                { _id: userId },
                { $set: { type: 'free' } }
            );

            const userDetails = await User.findOne({ _id: userId });
            await Subscription.findOneAndDelete({ subscription: id });

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                service: 'gmail',
                secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const Reactivate = process.env.WEBSITE_URL + "/pricing";

            const mailOptions = {
                from: process.env.EMAIL,
                to: userDetails.email,
                subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
                html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
            };

            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: '' });

        } catch (error) {
            console.log('Error', error);
        }
    });

});

//UPDATE SUBSCRIPTION
app.post('/api/paypalupdate', async (req, res) => {
    const { id, idPlan } = req.body;

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");

    try {
        const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${id}/revise`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "plan_id": idPlan, "application_context": { "brand_name": process.env.COMPANY, "locale": "en-US", "payment_method": { "payer_selected": "PAYPAL", "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED" }, "return_url": `${process.env.WEBSITE_URL}/payment-success/${idPlan}`, "cancel_url": `${process.env.WEBSITE_URL}/payment-failed` } })
        });
        const session = await response.json();
        res.send(session)
    } catch (error) {
        console.log('Error', error);
    }

});

//UPDATE SUBSCRIPTION AND USER DETAILS
app.post('/api/paypalupdateuser', async (req, res) => {
    const { id, mName, email, user, plan } = req.body;

    await Subscription.findOneAndUpdate(
        { subscription: id },
        { $set: { plan: plan } }
    ).then(async r => {
        await User.findOneAndUpdate(
            { _id: user },
            { $set: { type: plan } }
        ).then(async ress => {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                service: 'gmail',
                secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: `${mName} Your Subscription Plan Has Been Modifed`,
                html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
    
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Modifed<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
    
    <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Modifed</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${mName}, your subscription plan has been Modifed.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
    
                </html>`,
            };

            await transporter.sendMail(mailOptions);
        })
    });

});

//CREATE RAZORPAY SUBSCRIPTION
app.post('/api/razorpaycreate', async (req, res) => {
    const { plan, email, fullAddress } = req.body;
    try {
        const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
        const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

        const requestBody = {
            plan_id: plan,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
                notes_key_1: fullAddress,
            },
            notify_info: {
                notify_email: email
            }
        };

        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: YOUR_KEY_ID,
                password: YOUR_KEY_SECRET
            }
        };

        const requestData = JSON.stringify(requestBody);

        axios.post('https://api.razorpay.com/v1/subscriptions', requestData, config)
            .then(response => {
                res.send(response.data);
            })
            .catch(error => {
                console.log('Error', error);
            });

    } catch (error) {
        console.log('Error', error);
    }

});

//GET RAZORPAY SUBSCRIPTION DETAILS
app.post('/api/razorapydetails', async (req, res) => {

    const { subscriberId, uid, plan } = req.body;

    let cost = 0;
    if (plan === process.env.MONTH_TYPE) {
        cost = process.env.MONTH_COST
    } else {
        cost = process.env.YEAR_COST
    }
    cost = cost / 4;

    await Admin.findOneAndUpdate(
        { type: 'main' },
        { $inc: { total: cost } }
    );

    await User.findOneAndUpdate(
        { _id: uid },
        { $set: { type: plan } }
    ).then(async result => {

        const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
        const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
        const SUBSCRIPTION_ID = subscriberId;

        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: YOUR_KEY_ID,
                password: YOUR_KEY_SECRET
            }
        };

        axios.get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config)
            .then(response => {
                res.send(response.data);
            })
            .catch(error => {
                //DO NOTHING
            });

    }).catch(error => {
        res.status(500).json({ success: false, message: 'Internal server error' });
    })

});

//RAZORPAY PENDING
app.post('/api/razorapypending', async (req, res) => {

    const { sub } = req.body;

    const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUBSCRIPTION_ID = sub;

    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: YOUR_KEY_ID,
            password: YOUR_KEY_SECRET
        }
    };

    axios.get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            console.log('Error', error);
        });

});

//RAZORPAY CANCEL SUBSCRIPTION 
app.post('/api/razorpaycancel', async (req, res) => {
    const { id, email } = req.body;

    const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUBSCRIPTION_ID = id;

    const requestBody = {
        cancel_at_cycle_end: 0
    };

    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: YOUR_KEY_ID,
            password: YOUR_KEY_SECRET
        }
    };

    axios.post(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}/cancel`, requestBody, config)
        .then(async resp => {
            try {
                const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
                const userId = subscriptionDetails.user;

                await User.findOneAndUpdate(
                    { _id: userId },
                    { $set: { type: 'free' } }
                );

                const userDetails = await User.findOne({ _id: userId });
                await Subscription.findOneAndDelete({ subscription: id });

                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    service: 'gmail',
                    secure: true,
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD,
                    },
                });

                const Reactivate = process.env.WEBSITE_URL + "/pricing";

                const mailOptions = {
                    from: process.env.EMAIL,
                    to: userDetails.email,
                    subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
                    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                    <html lang="en">
                    
                      <head></head>
                     <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                     </div>
                    
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                          <tr style="width:100%">
                            <td>
                              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                                <tbody>
                                  <tr>
                                    <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                                  </tr>
                                </tbody>
                              </table>
                              <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                                   <tbody>
                                      <tr>
                                        <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                      </tr>
                                    </tbody>
                              </table>
                              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                              </td>
                          </tr>
                        </table>
                      </body>
                    
                    </html>`,
                };

                await transporter.sendMail(mailOptions);
                res.json({ success: true, message: '' });

            } catch (error) {
                console.log('Error', error);
            }
        })
        .catch(error => {
            console.log('Error', error);
        });
});

//CONTACT
app.post('/api/contact', async (req, res) => {
    const { fname, lname, email, phone, msg } = req.body;
    try {
        const newContact = new Contact({ fname, lname, email, phone, msg });
        await newContact.save();
        res.json({ success: true, message: 'Submitted' });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//ADMIN PANEL

//DASHBOARD
app.post('/api/dashboard', async (req, res) => {
    const users = await User.estimatedDocumentCount();
    const courses = await Course.estimatedDocumentCount();
    const admin = await Admin.findOne({ type: 'main' });
    const total = admin.total;
    const monthlyPlanCount = await User.countDocuments({ type: process.env.MONTH_TYPE });
    const yearlyPlanCount = await User.countDocuments({ type: process.env.YEAR_TYPE });
    let monthCost = monthlyPlanCount * process.env.MONTH_COST;
    let yearCost = yearlyPlanCount * process.env.YEAR_COST;
    let sum = monthCost + yearCost;
    let paid = yearlyPlanCount + monthlyPlanCount;
    const videoType = await Course.countDocuments({ type: 'video & text course' });
    const textType = await Course.countDocuments({ type: 'theory & image course' });
    let free = users - paid;
    res.json({ users: users, courses: courses, total: total, sum: sum, paid: paid, videoType: videoType, textType: textType, free: free, admin: admin });
});

//GET USERS
app.get('/api/getusers', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search ? {
            $or: [
                { mName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ]
        } : {};

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

//GET COURSES
app.get('/api/getcourses', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search ? {
            $or: [
                { mainTopic: { $regex: search, $options: 'i' } },
                { user: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ]
        } : {};

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

//GET PAID USERS
app.get('/api/getpaid', async (req, res) => {
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



// GET Admin Settings
app.get('/api/admin/settings', requireMainAdmin, async (req, res) => {
    try {
        const settings = await Settings.find({});
        const settingsMap = {};
        
        // Convert to key-value pairs and mask secrets
        settings.forEach(setting => {
            settingsMap[setting.key] = {
                value: setting.isSecret ? '••••••••' : setting.value,
                category: setting.category,
                isSecret: setting.isSecret
            };
        });

        // Add env defaults for missing settings
        const defaultSettings = {
            API_KEY: { value: '••••••••', category: 'ai', isSecret: true },
            EMAIL: { value: process.env.EMAIL || '', category: 'email', isSecret: false },
            PASSWORD: { value: '••••••••', category: 'email', isSecret: true },
            LOGO: { value: process.env.LOGO || '', category: 'branding', isSecret: false },
            COMPANY: { value: process.env.COMPANY || '', category: 'branding', isSecret: false },
            GOOGLE_CLIENT_ID: { value: process.env.GOOGLE_CLIENT_ID || '', category: 'social', isSecret: true },
            FACEBOOK_CLIENT_ID: { value: process.env.FACEBOOK_CLIENT_ID || '', category: 'social', isSecret: true },
            GOOGLE_LOGIN_ENABLED: { value: process.env.GOOGLE_LOGIN_ENABLED || 'true', category: 'social', isSecret: false },
            FACEBOOK_LOGIN_ENABLED: { value: process.env.FACEBOOK_LOGIN_ENABLED || 'true', category: 'social', isSecret: false }
        };

        // Merge with defaults
        Object.keys(defaultSettings).forEach(key => {
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

// UPDATE Admin Setting
app.put('/api/admin/settings/:key', requireMainAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        // Validate allowed keys
        const allowedKeys = ['API_KEY', 'EMAIL', 'PASSWORD', 'LOGO', 'COMPANY', 'GOOGLE_CLIENT_ID', 'FACEBOOK_CLIENT_ID', 'GOOGLE_LOGIN_ENABLED', 'FACEBOOK_LOGIN_ENABLED'];
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

        // Clear cache
        settingsCache.invalidate(key);

        console.log(`Setting ${key} updated by ${req.user.email}`);
        res.json({ success: true, message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//GET ADMINS
app.get('/api/getadmins', requireAdmin, async (req, res) => {
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
        const adminSearchQuery = search ? {
            $or: [
                { mName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ]
        } : {};

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
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

async function getEmailsOfAdmins() {
    const admins = await Admin.find({});
    return admins.map(admin => admin.email);
}

//ADD ADMIN
app.post('/api/addadmin', requireAdmin, async (req, res) => {
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
        const newAdmin = new Admin({ email: user.email, mName: user.mName, type: 'no' });
        await newAdmin.save();
        res.json({ success: true, message: 'Admin added successfully' });
    } catch (error) {
        console.log('Error', error);
    }
});

//REMOVE ADMIN
app.post('/api/removeadmin', requireAdmin, async (req, res) => {
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
        res.json({ success: true, message: 'Admin removed successfully' });
    } catch (error) {
        console.log('Error', error);
    }
});

//GET CONTACTS
app.get('/api/getcontact', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search ? {
            $or: [
                { fname: { $regex: search, $options: 'i' } },
                { lname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { msg: { $regex: search, $options: 'i' } }
            ]
        } : {};

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
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//SAVE ADMIN
app.post('/api/saveadmin', async (req, res) => {
    const { data, type } = req.body;
    try {
        if (type === 'terms') {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: { terms: data } }
            ).then(rl => {
                res.json({ success: true, message: 'Saved successfully' });
            });
        } else if (type === 'privacy') {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: { privacy: data } }
            ).then(rl => {
                res.json({ success: true, message: 'Saved successfully' });
            });
        } else if (type === 'cancel') {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: { cancel: data } }
            ).then(rl => {
                res.json({ success: true, message: 'Saved successfully' });
            });
        } else if (type === 'refund') {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: { refund: data } }
            ).then(rl => {
                res.json({ success: true, message: 'Saved successfully' });
            });
        } else if (type === 'billing') {
            await Admin.findOneAndUpdate(
                { type: 'main' },
                { $set: { billing: data } }
            ).then(rl => {
                res.json({ success: true, message: 'Saved successfully' });
            });
        }
    } catch (error) {
        console.log('Error', error);
    }
});

//GET POLICIES
app.get('/api/policies', async (req, res) => {
    try {
        const admins = await Admin.find({});
        res.json(admins);
    } catch (error) {
        console.log('Error', error);
    }
});

//GET PUBLIC SETTINGS (for client-side use)
app.get('/api/public/settings', async (req, res) => {
    try {
        const settings = await Settings.find({ isSecret: false });
        const publicSettings = {};

        settings.forEach(setting => {
            publicSettings[setting.key] = {
                value: setting.value,
                category: setting.category,
                isSecret: setting.isSecret
            };
        });

        res.json(publicSettings);
    } catch (error) {
        console.error('Public settings fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//STRIPE PAYMENT
app.post('/api/stripepayment', async (req, res) => {
    const { planId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            success_url: `${process.env.WEBSITE_URL}/payment-success/${planId}`,
            cancel_url: `${process.env.WEBSITE_URL}/payment-failed`,
            line_items: [
                {
                    price: planId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
        });

        res.json({ url: session.url, id: session.id })
    } catch (e) {
        console.log('Error', e);
        res.status(500).json({ error: e.message })
    }

});

app.post('/api/stripedetails', async (req, res) => {
    const { subscriberId, uid, plan } = req.body;

    let cost = 0;
    if (plan === process.env.MONTH_TYPE) {
        cost = process.env.MONTH_COST
    } else {
        cost = process.env.YEAR_COST
    }
    cost = cost / 4;

    await Admin.findOneAndUpdate(
        { type: 'main' },
        { $inc: { total: cost } }
    );

    await User.findOneAndUpdate(
        { _id: uid },
        { $set: { type: plan } }
    ).then(async result => {
        const session = await stripe.checkout.sessions.retrieve(subscriberId);
        res.send(session);
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })

});

app.post('/api/stripecancel', async (req, res) => {
    const { id, email } = req.body;

    const subscription = await stripe.subscriptions.cancel(
        id
    );

    try {
        const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
        const userId = subscriptionDetails.user;

        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { type: 'free' } }
        );

        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscriberId: id });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const Reactivate = process.env.WEBSITE_URL + "/pricing";

        const mailOptions = {
            from: process.env.EMAIL,
            to: userDetails.email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>

<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: '' });

    } catch (error) {
        console.log('Error', error);
    }

});

//PAYSTACK PAYMENT
app.post('/api/paystackpayment', async (req, res) => {
    const { planId, amountInZar, email } = req.body;
    try {

        const data = {
            email: email,
            amount: amountInZar,
            plan: planId
        };

        axios.post('https://api.paystack.co/transaction/initialize', data, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.data.status) {
                    const authorizationUrl = response.data.data.authorization_url;
                    res.json({ url: authorizationUrl });
                } else {
                    res.status(500).json({ error: 'Internal Server Error' })
                }
            })
            .catch(error => {
                res.status(500).json({ error: 'Internal Server Error' })
            });
    } catch (e) {
        console.log('Error', e);
        res.status(500).json({ error: e.message })
    }

});

//PAYSTACK GET DETAIL
app.post('/api/paystackfetch', async (req, res) => {
    const { email, uid, plan } = req.body;
    try {

        const searchEmail = email;
        const url = "https://api.paystack.co/subscription";
        const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;

        axios.get(url, {
            headers: {
                'Authorization': authorization
            }
        })
            .then(async response => {
                const jsonData = response.data;
                let subscriptionDetails = null;
                jsonData.data.forEach(subscription => {
                    if (subscription.customer.email === searchEmail) {
                        subscriptionDetails = {
                            subscription_code: subscription.subscription_code,
                            createdAt: subscription.createdAt,
                            updatedAt: subscription.updatedAt,
                            customer_code: subscription.customer.customer_code
                        };
                    }
                });

                if (subscriptionDetails) {

                    let cost = 0;
                    if (plan === process.env.MONTH_TYPE) {
                        cost = process.env.MONTH_COST
                    } else {
                        cost = process.env.YEAR_COST
                    }
                    cost = cost / 4;

                    await Admin.findOneAndUpdate(
                        { type: 'main' },
                        { $inc: { total: cost } }
                    );

                    await User.findOneAndUpdate(
                        { _id: uid },
                        { $set: { type: plan } }
                    ).then(async result => {
                        res.json({ details: subscriptionDetails });
                    }).catch(error => {
                        console.log('Error', error);
                        res.status(500).json({ success: false, message: 'Internal server error' });
                    })

                } else {
                    res.status(500).json({ error: 'Internal Server Error' })
                }
            })
            .catch(error => {
                console.log('Error', error);
                res.status(500).json({ error: 'Internal Server Error' })
            });


    } catch (e) {
        console.log('Error', e);
        res.status(500).json({ error: 'Internal Server Error' })
    }

});

//PAYSTACK PAYMENT
app.post('/api/paystackcancel', async (req, res) => {
    const { code, token, email } = req.body;

    const url = "https://api.paystack.co/subscription/disable";
    const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
    const contentType = "application/json";
    const data = {
        code: code,
        token: token
    };

    axios.post(url, data, {
        headers: {
            Authorization: authorization,
            'Content-Type': contentType
        }
    }).then(async response => {
        const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
        const userId = subscriptionDetails.user;

        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { type: 'free' } }
        );

        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscriberId: code });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const Reactivate = process.env.WEBSITE_URL + "/pricing";

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
                  <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                </html>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: '' });
    })

});


//FLUTTERWAVE PAYMENT
app.post('/api/flutterwavecancel', async (req, res) => {
    const { code, token, email } = req.body;

    const payload = { "id": code };
    const response = await flw.Subscription.cancel(payload)
    if (response) {
        const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
        const userId = subscriptionDetails.user;

        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { type: 'free' } }
        );

        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscriberId: token });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const Reactivate = process.env.WEBSITE_URL + "/pricing";

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: '' });
    } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


//CHAT
app.post('/api/chat', requireAuth, async (req, res) => {
    const receivedData = req.body;

    const promptString = receivedData.prompt;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    const genAI = await getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

    const prompt = promptString;

    await model.generateContent(prompt).then(result => {
        const response = result.response;
        const txt = response.text();
        // Store raw markdown instead of converting to HTML for better formatting
        const text = txt;
        res.status(200).json({ 
            text,
            contentType: 'markdown' // Add content type for frontend detection
        });
    }).catch(error => {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    })

});


//FLUTTERWAVE GET DETAILS
app.post('/api/flutterdetails', async (req, res) => {
    const { email, uid, plan } = req.body;
    try {
        let cost = 0;
        if (plan === process.env.MONTH_TYPE) {
            cost = process.env.MONTH_COST
        } else {
            cost = process.env.YEAR_COST
        }
        cost = cost / 4;

        await Admin.findOneAndUpdate(
            { type: 'main' },
            { $inc: { total: cost } }
        );

        await User.findOneAndUpdate(
            { _id: uid },
            { $set: { type: plan } }
        ).then(async result => {

            const payload = { "email": email };
            const response = await flw.Subscription.get(payload);

            res.send(response['data'][0]);
        }).catch(error => {
            console.log('Error', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        })
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//GET NOTES
app.post('/api/getnotes', async (req, res) => {
    const { course } = req.body;
    try {
        const existingNotes = await NotesSchema.findOne({ course: course });
        if (existingNotes) {
            res.json({ success: true, message: existingNotes.notes });
        } else {
            res.json({ success: false, message: '' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//SAVE NOTES
app.post('/api/savenotes', async (req, res) => {
    const { course, notes } = req.body;
    try {
        const existingNotes = await NotesSchema.findOne({ course: course });

        if (existingNotes) {
            await NotesSchema.findOneAndUpdate(
                { course: course },
                { $set: { notes: notes } }
            );
            res.json({ success: true, message: 'Notes updated successfully' });
        } else {
            const newNotes = new NotesSchema({ course: course, notes: notes });
            await newNotes.save();
            res.json({ success: true, message: 'Notes created successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//GENERATE EXAMS
app.post('/api/aiexam', requireAuth, async (req, res) => {
    const { courseId, mainTopic, subtopicsString, lang } = req.body;

    const existingNotes = await ExamSchema.findOne({ course: courseId });
    if (existingNotes) {
        res.json({ success: true, message: existingNotes.exam });
    } else {

        const prompt = `Strictly in ${lang},
        generate a strictly 10 question MCQ quiz on title ${mainTopic} based on each topics :- ${subtopicsString}, Atleast One question per topic. Add options A, B, C, D and only one correct answer. Give your repones Strictly inJSON format like this :-
        {
          "${mainTopic}": [
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            },
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            },
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            }
          ]
        }
        `;

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        const genAI = await getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

        await model.generateContent(prompt).then(async result => {
            const response = result.response;
            const txt = response.text();
            let output = txt.slice(7, txt.length - 4);

            const newNotes = new ExamSchema({ course: courseId, exam: output, marks: "0", passed: false });
            await newNotes.save();
            res.json({ success: true, message: output });

        }).catch(error => {
            console.log(error);
            res.json({ success: false });
        })

    }

});

//UPDATE RESULT
app.post('/api/updateresult', async (req, res) => {
    const { courseId, marksString } = req.body;
    try {

        await ExamSchema.findOneAndUpdate(
            { course: courseId },
            [{ $set: { marks: marksString, passed: true } }]
        ).then(result => {
            res.json({ success: true });
        }).catch(error => {
            res.json({ success: false });
        })

    } catch (error) {
        console.log('Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//SEND EXAM
app.post('/api/sendexammail', async (req, res) => {
    const { html, email, subjects } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const options = {
        from: process.env.EMAIL,
        to: email,
        subject: '' + subjects,
        html: html
    };

    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log('Error', error);
            res.status(500).json({ success: false, message: 'Failed to send email' });
        } else {
            res.json({ success: true, message: 'Email sent successfully' });
        }
    });
});

//GET RESULT
app.post('/api/getmyresult', async (req, res) => {
    const { courseId } = req.body;
    try {

        const existingNotes = await ExamSchema.findOne({ course: courseId });
        const lang = await LangSchema.findOne({ course: courseId });
        if (existingNotes) {
            if (lang) {
                res.json({ success: true, message: existingNotes.passed, lang: lang.lang });
            } else {
                res.json({ success: true, message: existingNotes.passed, lang: 'English' });
            }
        } else {
            if (lang) {
                res.json({ success: false, message: false, lang: lang.lang });
            } else {
                res.json({ success: false, message: false, lang: 'English' });
            }
        }

    } catch (error) {
        console.log('Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//DELETE
app.post('/api/deleteuser', async (req, res) => {
    try {
        const { userId } = req.body;;
        const deletedUser = await User.findOneAndDelete({ _id: userId });

        if (!deletedUser) {
            return res.json({ success: false, message: 'Internal Server Error' });
        }

        await Course.deleteMany({ user: userId });
        await Subscription.deleteMany({ user: userId });

        return res.json({ success: true, message: 'Profile deleted successfully' });

    } catch (error) {
        console.log('Error', error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

//CREATE Blog
app.post('/api/createblog', requireAdmin, async (req, res) => {
    try {
        const { title, excerpt, content, image, category, tags, popular, featured } = req.body;
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        const blogs = new BlogSchema({ 
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
        res.json({ success: true, message: 'Blog created successfully' });

    } catch (error) {
        console.log('Error', error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

//DELETE Blog
app.post('/api/deleteblogs', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        await BlogSchema.findOneAndDelete({ _id: id });
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});


//UPDATE Blog
app.post('/api/updateblogs', requireAdmin, async (req, res) => {
    try {
        const { id, type, value } = req.body;
        const booleanValue = value === 'true' ? true : false;
        if (type === 'popular') {
            await BlogSchema.findOneAndUpdate({ _id: id },
                { $set: { popular: booleanValue } }
            );
        } else {
            await BlogSchema.findOneAndUpdate({ _id: id },
                { $set: { featured: booleanValue } }
            );
        }
        res.json({ success: true, message: 'Blog updated successfully' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'Internal Server Error' });
    }
});

//GET BLOGS (Admin - with pagination)
app.get('/api/getblogs', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search ? {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const blogs = await BlogSchema.find(searchQuery)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await BlogSchema.countDocuments(searchQuery);
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
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

//GET ALL BLOGS (Public - no pagination)
app.get('/api/blogs/public', async (req, res) => {
    try {
        const blogs = await BlogSchema.find({})
            .sort({ date: -1 });

        res.json(blogs);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

//STATIC FILE SERVING
// Serve static files from the dist directory
app.use(express.static('dist'));

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile('index.html', { root: 'dist' });
});

//LISTEN
// Error handling middleware (must be last)
app.use(errorHandler);

// Dynamic port handling
const startServer = async () => {
    try {
        const serverPort = await getServerPort(PORT);
        const serverURL = getServerURL(serverPort);
        
        const server = app.listen(serverPort, async () => {
            logger.info(`🚀 Server started successfully!`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 Server URL: ${serverURL}`);
            logger.info(`❤️  Health check: ${serverURL}/health`);
            logger.info(`🔗 API Base URL: ${serverURL}/api`);
            
            // Initialize settings cache
            try {
                await settingsCache.preload();
                logger.info(`⚙️  Settings cache initialized`);
            } catch (error) {
                logger.error(`❌ Settings cache initialization failed:`, error);
            }
            
            // Update environment variables for other parts of the app
            process.env.ACTUAL_PORT = serverPort.toString();
            process.env.ACTUAL_SERVER_URL = serverURL;
            
            // Log port change if different from preferred
            if (serverPort !== PORT) {
                logger.warn(`⚠️  Using port ${serverPort} instead of preferred port ${PORT}`);
                logger.info(`💡 Update your frontend VITE_SERVER_URL to: ${serverURL}`);
            }
        });
        
        return server;
    } catch (error) {
        logger.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

const server = await startServer();

//QUIZ ENDPOINTS

//CREATE QUIZ
app.post('/api/quiz/create', requireAuth, async (req, res) => {
    try {
        const { userId, keyword, title, format, questionAndAnswers } = req.body;
        
        if (!userId || !keyword || !title) {
            return res.status(400).json({
                success: false,
                message: 'userId, keyword, and title are required'
            });
        }

        // Generate quiz content using AI
        const quizPrompt = `Create a comprehensive quiz about "${keyword}" with the title "${title}". 
        Format: ${format || 'mixed'}
        
        Generate 15-20 multiple choice questions in this markdown format:
        # Question text here?
        - Wrong answer option
        -* Correct answer option (marked with *)
        - Wrong answer option
        - Wrong answer option
        ## Explanation of the correct answer here
        
        Make the questions challenging and cover various aspects of the topic.`;

        const genAI = await getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(quizPrompt);
        const quizContent = result.response.text();

        // Generate unique slug
        const baseSlug = generateSlug(`${title}-${Date.now()}`);
        const slug = await generateUniqueSlug(baseSlug, Quiz);

        // Create quiz
        const newQuiz = new Quiz({
            userId,
            keyword,
            title,
            slug,
            format: format || 'mixed',
            content: quizContent,
            tokens: {
                prompt: quizPrompt.length,
                completion: quizContent.length,
                total: quizPrompt.length + quizContent.length
            },
            questionAndAnswers: questionAndAnswers || [],
            viewCount: 0,
            lastVisitedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newQuiz.save();

        logger.info(`Quiz created: ${newQuiz._id} with slug: ${slug}`);
        
        res.json({
            success: true,
            message: 'Quiz created successfully',
            quiz: {
                _id: newQuiz._id,
                slug: newQuiz.slug,
                title: newQuiz.title,
                keyword: newQuiz.keyword
            }
        });

    } catch (error) {
        logger.error(`Quiz creation error: ${error.message}`, { error: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to create quiz'
        });
    }
});

//GET USER QUIZZES
app.get('/api/quizzes', async (req, res) => {
    try {
        const { userId, page = 1, limit = 10 } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const skip = (page - 1) * limit;
        const totalCount = await Quiz.countDocuments({ userId });
        const totalPages = Math.ceil(totalCount / limit);

        const quizzes = await Quiz.find({ userId })
            .select('_id userId keyword title slug format tokens viewCount lastVisitedAt createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: quizzes,
            totalCount,
            totalPages,
            currPage: parseInt(page),
            perPage: parseInt(limit)
        });

    } catch (error) {
        logger.error(`Get quizzes error: ${error.message}`, { error: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quizzes'
        });
    }
});

//GET QUIZ BY SLUG
app.get('/api/quiz/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const quiz = await Quiz.findOne({ slug });
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Increment view count
        quiz.viewCount += 1;
        quiz.lastVisitedAt = new Date();
        await quiz.save();

        logger.info(`Quiz accessed by slug: ${slug}`);
        
        res.json({
            success: true,
            quiz: quiz
        });

    } catch (error) {
        logger.error(`Get quiz by slug error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz'
        });
    }
});

//GET QUIZ BY ID (Legacy support)
app.get('/api/quiz/id/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const quiz = await Quiz.findById(id);
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Increment view count
        quiz.viewCount += 1;
        quiz.lastVisitedAt = new Date();
        await quiz.save();

        // If quiz has slug, suggest redirect
        if (quiz.slug) {
            return res.json({
                success: true,
                quiz: quiz,
                redirect: `/quiz/${quiz.slug}`
            });
        }

        logger.info(`Quiz accessed by ID: ${id}`);
        
        res.json({
            success: true,
            quiz: quiz
        });

    } catch (error) {
        logger.error(`Get quiz by ID error: ${error.message}`, { error: error.stack, id: req.params.id });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz'
        });
    }
});

//DELETE QUIZ
app.delete('/api/quiz/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const quiz = await Quiz.findOneAndDelete({ slug, userId });
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found or unauthorized'
            });
        }

        logger.info(`Quiz deleted: ${quiz._id} (${slug})`);
        
        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });

    } catch (error) {
        logger.error(`Delete quiz error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to delete quiz'
        });
    }
});

//CREATE FLASHCARD
app.post('/api/flashcard/create', requireAuth, async (req, res) => {
    try {
        const { userId, keyword, title } = req.body;

        if (!userId || !keyword || !title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, keyword, title'
            });
        }

        // Generate flashcard content using AI
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        const genAI = await getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

        const prompt = `Create a comprehensive set of flashcards for the topic: "${keyword}". 
        
        Generate 15-20 flashcards that cover the key concepts, definitions, and important facts about this topic.
        
        Format your response as a JSON array where each flashcard has:
        - "front": The question or term (keep it concise)
        - "back": The answer or definition (detailed but clear)
        - "difficulty": "easy", "medium", or "hard"
        - "tags": Array of relevant tags for categorization
        
        Make sure the flashcards are educational, accurate, and cover different aspects of the topic.
        
        Example format:
        [
          {
            "front": "What is photosynthesis?",
            "back": "The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
            "difficulty": "medium",
            "tags": ["biology", "plants", "energy"]
          }
        ]
        
        Return only the JSON array, no additional text.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const generatedText = response.text();

        // Parse the generated flashcards
        let cards = [];
        try {
            // Clean the response to extract JSON
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cards = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No valid JSON found in response');
            }
        } catch (parseError) {
            logger.error(`Flashcard parsing error: ${parseError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to parse generated flashcards'
            });
        }

        // Generate unique slug
        const slug = await generateUniqueSlug(title, Flashcard);

        // Create flashcard set
        const newFlashcard = new Flashcard({
            userId,
            keyword,
            title,
            slug,
            content: generatedText,
            cards,
            tokens: {
                prompt: result.response.usageMetadata?.promptTokenCount || 0,
                completion: result.response.usageMetadata?.candidatesTokenCount || 0,
                total: result.response.usageMetadata?.totalTokenCount || 0
            }
        });

        await newFlashcard.save();

        logger.info(`Flashcard set created: ${newFlashcard._id} with slug: ${slug}`);
        res.json({
            success: true,
            message: 'Flashcard set created successfully',
            flashcardId: newFlashcard._id,
            slug: slug,
            cards: cards
        });

    } catch (error) {
        logger.error(`Flashcard creation error: ${error.message}`, { error: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to create flashcard set'
        });
    }
});

//GET USER FLASHCARDS
app.get('/api/flashcards', async (req, res) => {
    try {
        const { userId, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const skip = (page - 1) * limit;
        const flashcards = await Flashcard.find({ userId })
            .select('title keyword slug createdAt cards viewCount')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Flashcard.countDocuments({ userId });

        // Add card count to each flashcard
        const flashcardsWithCount = flashcards.map(flashcard => ({
            ...flashcard.toObject(),
            cardCount: flashcard.cards.length
        }));

        res.json({
            success: true,
            flashcards: flashcardsWithCount,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error(`Get flashcards error: ${error.message}`, { error: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcards'
        });
    }
});

//GET FLASHCARD BY SLUG
app.get('/api/flashcard/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const flashcard = await Flashcard.findOne({ slug });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard set not found'
            });
        }

        // Update view count and last visited
        flashcard.viewCount += 1;
        flashcard.lastVisitedAt = new Date();
        await flashcard.save();

        logger.info(`Flashcard accessed by slug: ${slug}`);
        res.json({
            success: true,
            flashcard: flashcard
        });

    } catch (error) {
        logger.error(`Get flashcard by slug error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcard set'
        });
    }
});

//DELETE FLASHCARD
app.delete('/api/flashcard/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const flashcard = await Flashcard.findOne({ slug, userId });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard set not found or unauthorized'
            });
        }

        await Flashcard.deleteOne({ _id: flashcard._id });

        logger.info(`Flashcard deleted: ${flashcard._id} (${slug})`);

        res.json({
            success: true,
            message: 'Flashcard set deleted successfully'
        });

    } catch (error) {
        logger.error(`Delete flashcard error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to delete flashcard set'
        });
    }
});

//CREATE GUIDE
app.post('/api/guide/create', requireAuth, async (req, res) => {
    try {
        const { userId, keyword, title, customization } = req.body;

        if (!userId || !keyword || !title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, keyword, title'
            });
        }

        // Generate guide content using AI
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        const genAI = await getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

        const prompt = `Create a comprehensive study guide for the topic: "${keyword}".

        Title: ${title}
        
        ${customization ? `Additional requirements: ${customization}` : ''}
        
        Create a detailed study guide with the following structure:

        # ${title}

        [Write comprehensive content here with sections, examples, and explanations]

        ## Related Topics
        - Topic 1
        - Topic 2  
        - Topic 3
        - Topic 4

        ## Deep Dive Topics
        - Advanced Topic 1
        - Advanced Topic 2
        - Advanced Topic 3

        ## Study Questions
        1. Question 1?
        2. Question 2?
        3. Question 3?
        4. Question 4?
        5. Question 5?

        Guidelines:
        - Content should be comprehensive but concise (single-page format)
        - Use markdown formatting with headers, lists, code blocks, and emphasis
        - Include practical examples and real-world applications
        - Make it suitable for quick reference and study
        - Related topics should be closely connected concepts (3-5 topics)
        - Deep dive topics should be advanced/specialized areas for further study (3-4 topics)
        - Questions should test understanding of key concepts (5-8 questions)
        - Aim for 2000-4000 words in the main content section
        
        Write the complete guide following this exact structure.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const generatedText = response.text();
        
        // Log the raw response for debugging (first 500 chars)
        logger.info(`AI Response preview: ${generatedText.substring(0, 500)}...`);

        // Parse the generated guide from markdown structure
        let guideData = {};
        try {
            // Extract main content (everything before "## Related Topics")
            const relatedTopicsIndex = generatedText.indexOf('## Related Topics');
            let mainContent = relatedTopicsIndex > -1 ? generatedText.substring(0, relatedTopicsIndex).trim() : generatedText;
            
            // Extract related topics
            let relatedTopics = [];
            const relatedMatch = generatedText.match(/## Related Topics\s*([\s\S]*?)(?=## |$)/);
            if (relatedMatch) {
                const relatedSection = relatedMatch[1];
                relatedTopics = relatedSection
                    .split('\n')
                    .filter(line => line.trim().startsWith('-'))
                    .map(line => line.replace(/^-\s*/, '').trim())
                    .filter(topic => topic.length > 0);
            }
            
            // Extract deep dive topics
            let deepDiveTopics = [];
            const deepDiveMatch = generatedText.match(/## Deep Dive Topics\s*([\s\S]*?)(?=## |$)/);
            if (deepDiveMatch) {
                const deepDiveSection = deepDiveMatch[1];
                deepDiveTopics = deepDiveSection
                    .split('\n')
                    .filter(line => line.trim().startsWith('-'))
                    .map(line => line.replace(/^-\s*/, '').trim())
                    .filter(topic => topic.length > 0);
            }
            
            // Extract study questions
            let questions = [];
            const questionsMatch = generatedText.match(/## Study Questions\s*([\s\S]*?)(?=## |$)/);
            if (questionsMatch) {
                const questionsSection = questionsMatch[1];
                questions = questionsSection
                    .split('\n')
                    .filter(line => line.trim().match(/^\d+\./))
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .filter(question => question.length > 0);
            }
            
            guideData = {
                content: mainContent,
                relatedTopics: relatedTopics,
                deepDiveTopics: deepDiveTopics,
                questions: questions
            };
            
            logger.info(`Successfully parsed guide: ${relatedTopics.length} related topics, ${deepDiveTopics.length} deep dive topics, ${questions.length} questions`);
            
        } catch (parseError) {
            logger.error(`Guide parsing error: ${parseError.message}`);
            logger.error(`Stack trace: ${parseError.stack}`);
            logger.info('Using fallback parsing method');
            
            // Fallback: Use the raw content and try to extract some basic structure
            guideData = {
                content: generatedText,
                relatedTopics: [],
                deepDiveTopics: [],
                questions: []
            };
            
            // Try to extract questions from anywhere in the content
            const questionMatches = generatedText.match(/\d+\.\s+([^?\n]*\?)/g);
            if (questionMatches) {
                guideData.questions = questionMatches.slice(0, 10).map(q => q.replace(/^\d+\.\s*/, ''));
            }
        }
        
        // Ensure we always have valid data
        if (!guideData || typeof guideData !== 'object') {
            logger.warn('Guide data is invalid, creating minimal structure');
            guideData = {
                content: generatedText || `# ${title}\n\nGuide content could not be parsed properly.`,
                relatedTopics: [],
                deepDiveTopics: [],
                questions: []
            };
        }

        // Generate unique slug
        logger.info('Generating unique slug for guide');
        const slug = await generateUniqueSlug(title, Guide);
        logger.info(`Generated slug: ${slug}`);

        // Create guide
        logger.info('Creating new guide document');
        const newGuide = new Guide({
            userId,
            keyword,
            title,
            slug,
            content: guideData.content || generatedText,
            relatedTopics: guideData.relatedTopics || [],
            deepDiveTopics: guideData.deepDiveTopics || [],
            questions: guideData.questions || [],
            tokens: {
                prompt: result.response.usageMetadata?.promptTokenCount || 0,
                completion: result.response.usageMetadata?.candidatesTokenCount || 0,
                total: result.response.usageMetadata?.totalTokenCount || 0
            }
        });

        logger.info('Saving guide to database');
        await newGuide.save();
        logger.info(`Guide saved successfully: ${newGuide._id} with slug: ${slug}`);
        res.json({
            success: true,
            message: 'Guide created successfully',
            guideId: newGuide._id,
            slug: slug,
            guide: {
                title: newGuide.title,
                keyword: newGuide.keyword,
                relatedTopics: newGuide.relatedTopics,
                deepDiveTopics: newGuide.deepDiveTopics,
                questions: newGuide.questions
            }
        });

    } catch (error) {
        logger.error(`Guide creation error: ${error.message}`, { error: error.stack, userId, keyword, title });
        res.status(500).json({
            success: false,
            message: `Failed to create guide: ${error.message}`
        });
    }
});

//TEST ENDPOINT TO VERIFY CODE VERSION
app.get('/api/guide/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Guide API updated - v2.0',
        timestamp: new Date().toISOString()
    });
});

//GET USER GUIDES
app.get('/api/guides', async (req, res) => {
    try {
        const { userId, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const skip = (page - 1) * limit;
        const guides = await Guide.find({ userId })
            .select('title keyword slug createdAt viewCount relatedTopics')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Guide.countDocuments({ userId });

        res.json({
            success: true,
            guides: guides,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error(`Get guides error: ${error.message}`, { error: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guides'
        });
    }
});

//GET GUIDE BY SLUG
app.get('/api/guide/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const guide = await Guide.findOne({ slug });

        if (!guide) {
            return res.status(404).json({
                success: false,
                message: 'Guide not found'
            });
        }

        // Update view count and last visited
        guide.viewCount += 1;
        guide.lastVisitedAt = new Date();
        await guide.save();

        logger.info(`Guide accessed by slug: ${slug}`);
        res.json({
            success: true,
            guide: guide
        });

    } catch (error) {
        logger.error(`Get guide by slug error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guide'
        });
    }
});

//DELETE GUIDE
app.delete('/api/guide/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const guide = await Guide.findOne({ slug, userId });

        if (!guide) {
            return res.status(404).json({
                success: false,
                message: 'Guide not found or unauthorized'
            });
        }

        await Guide.deleteOne({ _id: guide._id });

        logger.info(`Guide deleted: ${guide._id} (${slug})`);

        res.json({
            success: true,
            message: 'Guide deleted successfully'
        });

    } catch (error) {
        logger.error(`Delete guide error: ${error.message}`, { error: error.stack, slug: req.params.slug });
        res.status(500).json({
            success: false,
            message: 'Failed to delete guide'
        });
    }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        logger.info('HTTP server closed.');
        
        // Close database connection
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed.');
            process.exit(0);
        });
    });

    // Force close server after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));