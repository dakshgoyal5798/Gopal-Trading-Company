/**
 * Auth Routes
 * /api/auth/*
 */

const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup',   signup);
router.post('/login',    login);
router.post('/forgot',   forgotPassword);
router.put('/reset/:token', resetPassword);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateProfile);
router.put('/password',  protect, changePassword);

module.exports = router;
