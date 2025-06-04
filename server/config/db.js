const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Log the connection attempt
    console.log('Attempting to connect to MongoDB...');
    
    // Get the connection URI from environment variables or use local fallback
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/krishisahay';
    console.log(`Using database: ${uri.includes('@') ? uri.split('@')[1].split('/')[0] : 'localhost'}`);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Log successful connection with database name
    console.log(`MongoDB Connected ✅ (Database: ${mongoose.connection.name})`);
    
    // Set up connection error handler for future errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Set up disconnection handler
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected ⚠️');
    });
    
  } catch (err) {
    console.error('MongoDB connection error ❌:', err.message);
    // More detailed error information
    if (err.name === 'MongoNetworkError') {
      console.error('Network error - please check your internet connection and MongoDB URI');
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server - please check if MongoDB is running');
    }
    process.exit(1);
  }
};

module.exports = connectDB;