const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @route   GET api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// @route   GET api/health/db
// @desc    Database connection check
// @access  Public
router.get('/db', async (req, res) => {
  try {
    // Check if mongoose is connected
    const isConnected = mongoose.connection.readyState === 1;
    
    if (isConnected) {
      res.status(200).json({ 
        status: 'ok', 
        message: 'Database connection is active',
        dbName: mongoose.connection.name
      });
    } else {
      res.status(503).json({ 
        status: 'error', 
        message: 'Database connection is not active',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error checking database connection',
      error: err.message
    });
  }
});

module.exports = router;