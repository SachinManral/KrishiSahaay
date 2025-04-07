const mongoose = require('mongoose');

const WeatherSchema = new mongoose.Schema({
  location: {
    name: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lon: {
        type: Number,
        required: true
      }
    }
  },
  current: {
    temp_c: Number,
    condition: {
      text: String,
      icon: String
    },
    humidity: Number,
    wind_kph: Number,
    precip_mm: Number
  },
  forecast: [{
    date: String,
    day: {
      maxtemp_c: Number,
      mintemp_c: Number,
      condition: {
        text: String,
        icon: String
      },
      daily_chance_of_rain: Number,
      avghumidity: Number
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Index for faster queries and TTL for automatic expiration
WeatherSchema.index({ 'location.name': 1, 'location.country': 1 });
WeatherSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lon': 1 });
WeatherSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Weather', WeatherSchema);