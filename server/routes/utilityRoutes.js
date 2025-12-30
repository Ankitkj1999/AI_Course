import express from 'express';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import Contact from '../models/Contact.js';
import logger from '../utils/logger.js';
import settingsCache from '../services/settingsCache.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * Utility and Communication Routes
 * Handles: Email sending, health checks, public settings, contact forms
 */

// Initialize email transporter
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

// ============================================================================
// EMAIL ROUTES
// ============================================================================

/**
 * POST /api/data - Send email
 * @body {string} to - Recipient email
 * @body {string} subject - Email subject
 * @body {string} html - Email HTML content
 */
router.post('/data', async (req, res) => {
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

/**
 * POST /api/sendcertificate - Send certificate email
 * @body {string} html - Certificate HTML content
 * @body {string} email - Recipient email
 */
router.post('/sendcertificate', async (req, res) => {
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
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    } else {
      res.json({ success: true, message: 'Email sent successfully' });
    }
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/health - Health check endpoint
 * Returns system status, database connection, AI service status, and memory usage
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check AI service (optional - can be slow)
    let aiStatus = 'unknown';
    try {
      const genAI = await getAI();
      const testModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      await testModel.generateContent('test');
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
        ai: aiStatus,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// ============================================================================
// PUBLIC SETTINGS
// ============================================================================

/**
 * GET /api/public/settings - Get public settings
 * Returns non-secret settings for client-side use
 */
router.get('/public/settings', async (req, res) => {
  try {
    const settings = await Settings.find({ isSecret: false });
    const publicSettings = {};

    settings.forEach((setting) => {
      publicSettings[setting.key] = {
        value: setting.value,
        category: setting.category,
        isSecret: setting.isSecret,
      };
    });

    res.json(publicSettings);
  } catch (error) {
    console.error('Public settings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// CONTACT FORM
// ============================================================================

/**
 * POST /api/contact - Submit contact form
 * @body {string} fname - First name
 * @body {string} lname - Last name
 * @body {string} email - Email address
 * @body {string} phone - Phone number
 * @body {string} msg - Message
 */
router.post('/contact', async (req, res) => {
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

export default router;
