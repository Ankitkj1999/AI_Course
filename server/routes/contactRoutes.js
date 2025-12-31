import express from 'express';
import { Contact } from '../models/index.js';

const router = express.Router();

// POST /api/contact - Handle contact form submissions
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
