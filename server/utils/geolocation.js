const axios = require('axios');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

/**
 * Get location details from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Location details
 */
const getLocationFromCoordinates = async (lat, lon) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    
    const response = await axios.get(url);
    if (response.data && response.data.length > 0) {
      return {
        name: response.data[0].name,
        country: response.data[0].country,
        state: response.data[0].state
      };
    }
    
    throw new Error('Location not found');
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return {
      name: 'Unknown Location',
      country: 'Unknown'
    };
  }
};

/**
 * Get coordinates from location name using geocoding
 * @param {string} locationName - Name of the location
 * @returns {Promise<Object>} Coordinates
 */
const getCoordinatesFromLocation = async (locationName) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${apiKey}`;
    
    const response = await axios.get(url);
    if (response.data && response.data.length > 0) {
      return {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        country: response.data[0].country
      };
    }
    
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw error;
  }
};

/**
 * Get current IP-based location (fallback method)
 * @returns {Promise<Object>} Location details based on IP
 */
const getIpBasedLocation = async () => {
  try {
    // Using a free IP geolocation API
    const response = await axios.get('https://ipapi.co/json/');
    
    if (response.data) {
      return {
        name: response.data.city,
        country: response.data.country_name,
        state: response.data.region,
        lat: response.data.latitude,
        lon: response.data.longitude
      };
    }
    
    throw new Error('IP-based location not found');
  } catch (error) {
    console.error('IP geolocation error:', error.message);
    // Return default location (New Delhi, India)
    return {
      name: 'New Delhi',
      country: 'India',
      state: 'Delhi',
      lat: 28.6139,
      lon: 77.2090,
      error: error.message
    };
  }
};

module.exports = {
  getLocationFromCoordinates,
  getCoordinatesFromLocation,
  getIpBasedLocation
};