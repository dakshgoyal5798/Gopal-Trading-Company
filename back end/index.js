/**
 * Gopal Trading Company - Main Server Entry Point
 * Express + MongoDB + JWT Authentication
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../front end/client')));

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes   = require('./routes/auth');
const orderRoutes  = require('./routes/orders');
const adminRoutes  = require('./routes/admin');
const userRoutes   = require('./routes/users');
const contactRoutes = require('./routes/contact');

app.use('/api/auth',   authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Gopal Trading API is running', timestamp: new Date() });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../front end/client/index.html'));
  }
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ─── Database Connection & Start ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gopal_trading')
  .then(async () => {
    console.log('✅ MongoDB connected successfully');

    // Auto-create admin account if none exists
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads folder: ${path.join(__dirname, 'uploads')}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Seed Admin Account ───────────────────────────────────────────────────────
async function seedAdmin() {
  const User   = require('./models/User');
  const bcrypt = require('bcryptjs');

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1234', 10);
  await User.findOneAndUpdate(
    { role: 'admin' },
    {
      $set: {
        name:     'Admin',
        email:    (process.env.ADMIN_EMAIL || 'admin@gopaltrading.com').toLowerCase(),
        phone:    '9999999999',
        password: hashed,
        role:     'admin',
        isActive: true
      }
    },
    { upsert: true, new: true }
  );
  console.log('👤 Admin ready:', process.env.ADMIN_EMAIL || 'admin@gopaltrading.com');
}

module.exports = app;
