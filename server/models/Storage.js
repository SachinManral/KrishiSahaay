const mongoose = require('mongoose');

const StorageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['warehouse', 'cold-storage', 'silo', 'other'],
    required: true
  },
  capacity: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    }
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  price: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    period: {
      type: String,
      enum: ['day', 'week', 'month'],
      default: 'month'
    }
  },
  features: [String],
  description: String,
  images: [String],
  availability: {
    type: String,
    enum: ['available', 'partially-available', 'full'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Storage', StorageSchema);