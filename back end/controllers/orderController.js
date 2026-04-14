/**
 * Order Controller
 * Handles order creation, retrieval, and status updates
 */

const Order = require('../models/Order');
const path = require('path');
const fs = require('fs');
const { sendOrderConfirmation, sendStatusUpdate } = require('../utils/mailer');


// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Create a new order (user)
const createOrder = async (req, res) => {
  try {
    const { textList, address, deliveryDate, timeSlot } = req.body;

    // At least one of file or text list is required
    if (!req.file && (!textList || textList.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file or type your grocery list.'
      });
    }

    if (!address || !deliveryDate || !timeSlot) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Address, delivery date, and time slot are required.'
      });
    }

    // Validate delivery date is in the future
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Delivery date must be today or in the future.' });
    }

    const orderData = {
      userId: req.user._id,
      address,
      deliveryDate: selectedDate,
      timeSlot,
      textList: textList || ''
    };

    // If file was uploaded, save its path
    if (req.file) {
      orderData.fileUrl = `/uploads/${req.file.filename}`;
      orderData.fileName = req.file.originalname;
    }

    const order = await Order.create(orderData);
    await order.populate('userId', 'name email phone');

    // Fire-and-forget confirmation email
    sendOrderConfirmation(req.user, order).catch(err => console.warn('Mail error:', err.message));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! We will review and confirm shortly.',
      order
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
};

// ─── GET /api/orders/user ─────────────────────────────────────────────────────
// Get logged-in user's orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Filter by status
    if (status && status !== 'All') {
      filter.status = status;
    }

    // Search by address or user details
    let orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply search filter on populated data
    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(o =>
        (o.userId?.name || '').toLowerCase().includes(s) ||
        (o.userId?.email || '').toLowerCase().includes(s) ||
        (o.userId?.phone || '').includes(s) ||
        o.address.toLowerCase().includes(s)
      );
    }

    const total = await Order.countDocuments(filter);

    res.json({ success: true, count: orders.length, total, orders });
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
// Get single order details
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Users can only see their own orders
    if (req.user.role !== 'admin' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
};

// ─── PUT /api/orders/:id ──────────────────────────────────────────────────────
// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'Out for Delivery', 'Delivered', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '' },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Fire-and-forget status update email
    sendStatusUpdate(order.userId, order).catch(err => console.warn('Mail error:', err.message));

    res.json({ success: true, message: `Order status updated to "${status}".`, order });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order.' });
  }
};

// ─── GET /api/orders/stats ────────────────────────────────────────────────────
// Get order statistics (admin analytics)
const getOrderStats = async (req, res) => {
  try {
    const total     = await Order.countDocuments();
    const pending   = await Order.countDocuments({ status: 'Pending' });
    const accepted  = await Order.countDocuments({ status: 'Accepted' });
    const delivered = await Order.countDocuments({ status: 'Delivered' });
    const rejected  = await Order.countDocuments({ status: 'Rejected' });
    const outForDelivery = await Order.countDocuments({ status: 'Out for Delivery' });

    // Orders per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({ createdAt: { $gte: sevenDaysAgo } })
      .select('createdAt status');

    res.json({
      success: true,
      stats: { total, pending, accepted, delivered, rejected, outForDelivery, recentOrders }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus, getOrderStats };
