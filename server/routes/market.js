const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/market/prices
// @desc    Get current market prices
// @access  Public
router.get('/prices', async (req, res) => {
  try {
    // Placeholder data - replace with actual API call or database query
    const marketPrices = [
      { crop: 'Rice', price: 2100, unit: 'per quintal', location: 'Punjab' },
      { crop: 'Wheat', price: 2015, unit: 'per quintal', location: 'Haryana' },
      { crop: 'Cotton', price: 6300, unit: 'per quintal', location: 'Gujarat' },
      { crop: 'Sugarcane', price: 315, unit: 'per quintal', location: 'Uttar Pradesh' },
      { crop: 'Soybean', price: 4200, unit: 'per quintal', location: 'Madhya Pradesh' }
    ];
    
    res.json(marketPrices);
  } catch (err) {
    console.error('Error fetching market prices:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/market/trends
// @desc    Get market price trends
// @access  Public
router.get('/trends', async (req, res) => {
  try {
    // Placeholder data - replace with actual API call or database query
    const trends = {
      rice: [
        { month: 'Jan', price: 1950 },
        { month: 'Feb', price: 2000 },
        { month: 'Mar', price: 2050 },
        { month: 'Apr', price: 2100 },
        { month: 'May', price: 2150 }
      ],
      wheat: [
        { month: 'Jan', price: 1900 },
        { month: 'Feb', price: 1950 },
        { month: 'Mar', price: 2000 },
        { month: 'Apr', price: 2015 },
        { month: 'May', price: 2025 }
      ]
    };
    
    res.json(trends);
  } catch (err) {
    console.error('Error fetching market trends:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;