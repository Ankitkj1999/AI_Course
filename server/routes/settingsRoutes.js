import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// GET /api/public/settings - Get public settings for client-side use
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

export default router;
