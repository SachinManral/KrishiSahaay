const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ extended: false, limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Define routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
// If profile route exists, uncomment this line
// app.use('/api/profile', require('./routes/profile'));
app.use('/api/ai-assistance', require('./routes/ai-assistance'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/market', require('./routes/market'));
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai-assistance', require('./routes/ai-assistance'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Define port - ensure this is set to 5002
const PORT = process.env.PORT || 5002;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));