import express from 'express';
import { Blog } from '../models/index.js';

const router = express.Router();

// GET /api/blogs/public - Get all blogs (public, no pagination)
router.get('/blogs/public', async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ date: -1 });
    res.json(blogs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
