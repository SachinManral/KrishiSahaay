const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Storage = require('../models/Storage');

// @route   POST api/storage
// @desc    Create a new storage listing
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      type,
      capacity,
      location,
      coordinates,
      price,
      features,
      description,
      images,
      availability
    } = req.body;
    
    const newStorage = new Storage({
      user: req.user.id,
      name,
      type,
      capacity,
      location,
      coordinates,
      price,
      features,
      description,
      images,
      availability
    });

    const storage = await newStorage.save();
    res.json(storage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/storage
// @desc    Get all storage listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const storages = await Storage.find()
      .sort({ createdAt: -1 })
      .populate('user', ['name', 'phone']);
    res.json(storages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/storage/user
// @desc    Get current user's storage listings
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const storages = await Storage.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(storages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/storage/:id
// @desc    Get storage by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const storage = await Storage.findById(req.params.id)
      .populate('user', ['name', 'phone', 'location']);
    
    if (!storage) {
      return res.status(404).json({ msg: 'Storage not found' });
    }

    res.json(storage);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Storage not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/storage/:id
// @desc    Update a storage listing
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let storage = await Storage.findById(req.params.id);
    
    if (!storage) {
      return res.status(404).json({ msg: 'Storage not found' });
    }
    
    // Check user
    if (storage.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    const {
      name,
      type,
      capacity,
      location,
      coordinates,
      price,
      features,
      description,
      images,
      availability
    } = req.body;
    
    // Build storage object
    const storageFields = {};
    if (name) storageFields.name = name;
    if (type) storageFields.type = type;
    if (capacity) storageFields.capacity = capacity;
    if (location) storageFields.location = location;
    if (coordinates) storageFields.coordinates = coordinates;
    if (price) storageFields.price = price;
    if (features) storageFields.features = features;
    if (description) storageFields.description = description;
    if (images) storageFields.images = images;
    if (availability) storageFields.availability = availability;
    
    storage = await Storage.findByIdAndUpdate(
      req.params.id,
      { $set: storageFields },
      { new: true }
    );
    
    res.json(storage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/storage/:id
// @desc    Delete a storage listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const storage = await Storage.findById(req.params.id);
    
    if (!storage) {
      return res.status(404).json({ msg: 'Storage not found' });
    }
    
    // Check user
    if (storage.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await storage.deleteOne();
    res.json({ msg: 'Storage removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Storage not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;