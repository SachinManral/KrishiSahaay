const express = require('express');
const router = express.Router();
const aiAssistance = require('../utils/aiAssistance');
const geolocation = require('../utils/geolocation');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get farming advice
router.post('/farming-advice', auth, async (req, res) => {
  try {
    const { query, weather, location, crop } = req.body;
    
    if (!query) {
      return res.status(400).json({ msg: 'Query is required' });
    }
    
    const advice = await aiAssistance.getFarmingAdvice(query, { weather, location, crop });
    res.json(advice);
  } catch (err) {
    console.error('Farming advice error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get crop recommendations
router.post('/crop-recommendations', auth, async (req, res) => {
  try {
    const { soilData, weatherData, locationData } = req.body;
    
    if (!soilData || !weatherData) {
      return res.status(400).json({ msg: 'Soil and weather data are required' });
    }
    
    const recommendations = await aiAssistance.getCropRecommendations(soilData, weatherData, locationData);
    res.json(recommendations);
  } catch (err) {
    console.error('Crop recommendations error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Analyze plant disease from image
router.post('/analyze-plant', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Image file is required' });
    }
    
    // Read the uploaded file and convert to base64
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Delete the file after reading
    fs.unlinkSync(imagePath);
    
    const analysis = await aiAssistance.analyzePlantDisease(imageBase64);
    res.json(analysis);
  } catch (err) {
    console.error('Plant analysis error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;