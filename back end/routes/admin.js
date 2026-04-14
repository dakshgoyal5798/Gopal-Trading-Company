/**
 * Admin Routes
 * /api/admin/*
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAllUsers, toggleUserStatus, getDashboardStats, getContacts } = require('../controllers/adminController');

router.get('/dashboard',        protect, adminOnly, getDashboardStats);
router.get('/users',            protect, adminOnly, getAllUsers);
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);
router.get('/contacts',         protect, adminOnly, getContacts);

module.exports = router;
