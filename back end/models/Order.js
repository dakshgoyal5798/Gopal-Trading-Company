/**
 * Order Model
 * Stores customer grocery orders/requests
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Either a file upload OR a text list
  fileUrl: {
    type: String,
    default: null // relative path to uploaded file
  },
  fileName: {
    type: String,
    default: null
  },
  textList: {
    type: String,
    default: '' // manual grocery list typed by user
  },
  address: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Delivery time slot is required'],
    enum: ['9am-12pm', '12pm-3pm', '3pm-6pm', '6pm-9pm']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Out for Delivery', 'Delivered', 'Rejected'],
    default: 'Pending'
  },
  adminNote: {
    type: String,
    default: '' // admin can add a note when accepting/rejecting
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual: formatted order ID (e.g., GT-1001)
orderSchema.virtual('orderId').get(function() {
  return `GT-${1000 + (this._id.toString().slice(-4) * 1 % 9000)}`;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
