const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

/**
 * Fetch current weather data for a location
 * @param {string} location - City name or coordinates
 * @returns {Promise<Object>} - Weather data
 */
const getCurrentWeather = async (location = 'Delhi') => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        key: API_KEY,
        q: location,
        aqi: 'no'
      },
      timeout: 5000 // 5 second timeout
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Weather API error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

module.exports = {
  getCurrentWeather
};