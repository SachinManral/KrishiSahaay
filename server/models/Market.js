const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['wholesale', 'retail', 'mandi', 'auction', 'direct'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        village: String,
        district: String,
        state: String,
        pincode: String,
      },
    },
    operatingHours: {
      open: String,
      close: String,
      weekdays: [Number], // 0-6 (Sunday-Saturday)
    },
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    commodities: [{
      type: String,
    }],
    images: [String],
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
MarketSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Market', MarketSchema);