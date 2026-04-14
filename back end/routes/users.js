/**
 * User Routes (profile, etc.)
 * /api/users/*
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get own profile
router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
