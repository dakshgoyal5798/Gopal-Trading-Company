/**
 * Mailer Utility
 * Sends transactional emails for order events using Nodemailer.
 * Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 */

const nodemailer = require('nodemailer');

// Create reusable transporter (lazy init so app doesn't crash if SMTP not configured)
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

const FROM = `"Gopal Trading Company" <${process.env.SMTP_USER || 'noreply@gopaltrading.com'}>`;

// ─── Send Order Confirmation ──────────────────────────────
async function sendOrderConfirmation(user, order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return; // skip if not configured

  const orderId = `GT-${order._id.toString().slice(-5)}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#022c16;">Order Received ✅</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We've received your bulk order request. Our team will review and confirm it shortly.</p>
      <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Delivery Address:</strong> ${order.address}</p>
        <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Time Slot:</strong> ${order.timeSlot}</p>
        <p><strong>Status:</strong> Pending</p>
      </div>
      <p>You can track your order status by logging in to your dashboard.</p>
      <p style="color:#64748b;font-size:0.85rem;">— Gopal Trading Company</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: FROM,
    to: user.email,
    subject: `Order Confirmed – ${orderId} | Gopal Trading Company`,
    html
  });
}

// ─── Send Status Update ───────────────────────────────────
async function sendStatusUpdate(user, order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const orderId = `GT-${order._id.toString().slice(-5)}`;
  const statusColors = {
    'Accepted': '#3b82f6',
    'Out for Delivery': '#8b5cf6',
    'Delivered': '#10b981',
    'Rejected': '#ef4444'
  };
  const color = statusColors[order.status] || '#64748b';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#022c16;">Order Update 📦</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your order status has been updated:</p>
      <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>New Status:</strong> <span style="background:${color}22;color:${color};padding:4px 12px;border-radius:999px;font-weight:700;">${order.status}</span></p>
        ${order.adminNote ? `<p><strong>Note from us:</strong> ${order.adminNote}</p>` : ''}
        <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <p>Log in to your dashboard for more details.</p>
      <p style="color:#64748b;font-size:0.85rem;">— Gopal Trading Company</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: FROM,
    to: user.email,
    subject: `Order ${order.status} – ${orderId} | Gopal Trading Company`,
    html
  });
}

// ─── Send Password Reset ──────────────────────────────────
async function sendResetPasswordEmail(user, resetToken) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/#reset/${resetToken}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#022c16;">Password Reset Request 🔑</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your password for your Gopal Trading Company account. Click the button below to set a new password:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="background:#047857;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Reset Password</a>
      </div>
      <p style="font-size:0.9rem;color:var(--gray-600);">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
      <p style="color:#64748b;font-size:0.85rem;">— Gopal Trading Company</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: FROM,
    to: user.email,
    subject: `Reset Your Password | Gopal Trading Company`,
    html
  });
}

module.exports = { sendOrderConfirmation, sendStatusUpdate, sendResetPasswordEmail };
