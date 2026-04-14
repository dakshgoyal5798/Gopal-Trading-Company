/**
 * Order Routes
 * /api/orders/*
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createOrder, getUserOrders, getAllOrders,
  getOrderById, updateOrderStatus, getOrderStats
} = require('../controllers/orderController');

// User routes
router.post('/',           protect, upload.single('requirementFile'), createOrder);
router.get('/user',        protect, getUserOrders);
router.get('/stats',       protect, adminOnly, getOrderStats);
router.get('/',            protect, adminOnly, getAllOrders);
router.get('/:id',         protect, getOrderById);
router.put('/:id',         protect, adminOnly, updateOrderStatus);

module.exports = router;
