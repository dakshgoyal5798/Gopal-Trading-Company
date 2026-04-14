/**
 * Admin Controller
 * User management and admin-specific operations
 */

const User = require('../models/User');
const Order = require('../models/Order');
const Contact = require('../models/Contact');

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { role: 'user' };

    const users = await User.find(filter).sort({ createdAt: -1 });

    let result = users;
    if (search) {
      const s = search.toLowerCase();
      result = users.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.phone.includes(s)
      );
    }

    res.json({ success: true, count: result.length, users: result });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ─── PUT /api/admin/users/:id/toggle ─────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user
    });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments({ role: 'user' });
    const totalOrders  = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const rejectedOrders = await Order.countDocuments({ status: 'Rejected' });

    // Recent 5 orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name phone');

    // Orders by status breakdown
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Orders per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalOrders, pendingOrders,
        deliveredOrders, rejectedOrders,
        recentOrders, statusBreakdown, dailyOrders
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

// ─── GET /api/admin/contacts ──────────────────────────────────────────────
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ success: false, message: 'Failed to load contacts.' });
  }
};

module.exports = { getAllUsers, toggleUserStatus, getDashboardStats, getContacts };
