const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  '/',
  upload.single('profileImage'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('role', 'Role is required').isIn(['farmer', 'buyer', 'logistics'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user object
      user = new User({
        name,
        email,
        password,
        phone,
        role
      });

      // Add profile image path if uploaded
      if (req.file) {
        const relativePath = `/uploads/profile/${req.file.filename}`;
        user.profileImage = relativePath;
      }

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to database
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Generate JWT token
      jwt.sign(
        payload,
        config.jwtSecret,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          
          // Return token and user data (without password)
          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            createdAt: user.createdAt
          };
          
          res.json({ token, user: userData });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Add this route to test the API
router.get('/test', (req, res) => {
  res.json({ msg: 'Users API is working' });
});

// Make sure your registration route handles file uploads
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile');
  },
  filename: function(req, file, cb) {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter
});

module.exports = router;