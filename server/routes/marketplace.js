const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Crop = require('../models/Crop');
const User = require('../models/User');

// @route   POST api/marketplace
// @desc    Create a new crop listing
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantity, unit, price, description, location, harvestDate } = req.body;
    
    const newCrop = new Crop({
      user: req.user.id,
      name,
      category,
      quantity,
      unit,
      price,
      description,
      location,
      harvestDate
    });

    const crop = await newCrop.save();
    
    // Add crop to user's crops array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { crops: crop._id } }
    );

    res.json(crop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/marketplace
// @desc    Get all crop listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .populate('user', ['name', 'location', 'phone']);
    res.json(crops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/marketplace/user
// @desc    Get current user's crop listings
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/marketplace/:id
// @desc    Get crop by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('user', ['name', 'location', 'phone']);
    
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }

    res.json(crop);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Crop not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/marketplace/:id
// @desc    Update a crop listing
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }
    
    // Check user
    if (crop.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    const { name, category, quantity, unit, price, description, location, harvestDate, status } = req.body;
    
    // Build crop object
    const cropFields = {};
    if (name) cropFields.name = name;
    if (category) cropFields.category = category;
    if (quantity) cropFields.quantity = quantity;
    if (unit) cropFields.unit = unit;
    if (price) cropFields.price = price;
    if (description) cropFields.description = description;
    if (location) cropFields.location = location;
    if (harvestDate) cropFields.harvestDate = harvestDate;
    if (status) cropFields.status = status;
    
    crop = await Crop.findByIdAndUpdate(
      req.params.id,
      { $set: cropFields },
      { new: true }
    );
    
    res.json(crop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/marketplace/:id
// @desc    Delete a crop listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }
    
    // Check user
    if (crop.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await crop.deleteOne();
    
    // Remove crop from user's crops array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { crops: req.params.id } }
    );
    
    res.json({ msg: 'Crop removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Crop not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/marketplace/search
// @desc    Search for crops by name or category
// @access  Public
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const crops = await Crop.find({
      $and: [
        { status: 'available' },
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { category: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('user', ['name', 'location', 'phone']);
    
    res.json(crops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;