const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/logistics/transport
// @desc    Get transport options
// @access  Public
router.get('/transport', async (req, res) => {
  try {
    // Placeholder data - replace with actual API call or database query
    const transportOptions = [
      { type: 'Truck', capacity: '10 tons', rate: '₹15 per km', availability: 'High' },
      { type: 'Mini Truck', capacity: '5 tons', rate: '₹10 per km', availability: 'Medium' },
      { type: 'Tractor Trolley', capacity: '3 tons', rate: '₹8 per km', availability: 'High' },
      { type: 'Pickup Van', capacity: '1.5 tons', rate: '₹6 per km', availability: 'High' }
    ];
    
    res.json(transportOptions);
  } catch (err) {
    console.error('Error fetching transport options:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/logistics/book
// @desc    Book transport
// @access  Private
router.post('/book', auth, async (req, res) => {
  try {
    // Placeholder response - replace with actual booking logic
    res.json({ 
      message: 'Transport booking request received',
      bookingId: 'TR' + Math.floor(Math.random() * 10000),
      status: 'Pending'
    });
  } catch (err) {
    console.error('Error booking transport:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;