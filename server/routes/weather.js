const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Weather API key from environment variables
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Helper function to log errors
const logError = (message, error) => {
  console.error(`[Weather API] ${message}:`, error.message);
  if (error.response) {
    console.error(`Status: ${error.response.status}, Data:`, error.response.data);
  }
};

// @route   GET api/weather/current
// @desc    Get current weather
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ msg: 'Location is required' });
    }
    
    console.log(`Fetching weather data for ${location}`);
    
    // Use OpenWeatherMap API instead (free tier has higher limits)
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: location,
        appid: WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Format the response
    const weatherData = {
      name: response.data.name,
      sys: { country: response.data.sys.country },
      main: {
        temp: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure
      },
      weather: response.data.weather,
      wind: response.data.wind,
      rain: response.data.rain || {}
    };
    
    res.json(weatherData);
  } catch (err) {
    logError('Error fetching weather data', err);
    res.status(500).json({ 
      msg: 'Error fetching weather data', 
      error: err.message,
      details: err.response?.data || 'No additional details'
    });
  }
});

// @route   GET api/weather/forecast
// @desc    Get weather forecast
// @access  Public
router.get('/forecast', async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ msg: 'Location is required' });
    }
    
    console.log(`Fetching forecast data for ${location}`);
    
    // Use OpenWeatherMap API for forecast
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: location,
        appid: WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000
    });
    
    // Process the forecast data - group by day
    const forecastMap = {};
    
    response.data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!forecastMap[date]) {
        forecastMap[date] = {
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          pressure: item.main.pressure,
          rainfall: item.rain ? `${(item.rain['3h'] || 0)}mm` : '0mm'
        };
      } else {
        // Update max/min temperatures
        forecastMap[date].temp_max = Math.max(forecastMap[date].temp_max, item.main.temp_max);
        forecastMap[date].temp_min = Math.min(forecastMap[date].temp_min, item.main.temp_min);
      }
    });
    
    // Convert to array and limit to 5 days
    const forecast = Object.keys(forecastMap).map(date => ({
      date,
      ...forecastMap[date]
    })).slice(0, 5);
    
    res.json({ forecast });
  } catch (err) {
    logError('Error fetching weather forecast', err);
    res.status(500).json({ 
      msg: 'Error fetching weather forecast', 
      error: err.message,
      details: err.response?.data || 'No additional details'
    });
  }
});

// @route   GET api/weather/coordinates
// @desc    Get weather by coordinates
// @access  Public
router.get('/coordinates', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ msg: 'Latitude and longitude are required' });
    }
    
    console.log(`Fetching weather data for coordinates: ${lat},${lon}`);
    
    // Use OpenWeatherMap API for coordinates
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000
    });
    
    // Format the response (same as /current endpoint)
    const weatherData = {
      name: response.data.name,
      sys: { country: response.data.sys.country },
      main: {
        temp: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure
      },
      weather: response.data.weather,
      wind: response.data.wind,
      rain: response.data.rain || {}
    };
    
    res.json(weatherData);
  } catch (err) {
    logError('Error fetching weather data by coordinates', err);
    res.status(500).json({ 
      msg: 'Error fetching weather data by coordinates', 
      error: err.message,
      details: err.response?.data || 'No additional details'
    });
  }
});

// @route   GET api/weather/coordinates/forecast
// @desc    Get forecast by coordinates
// @access  Public
router.get('/coordinates/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ msg: 'Latitude and longitude are required' });
    }
    
    console.log(`Fetching forecast data for coordinates: ${lat},${lon}`);
    
    // Use OpenWeatherMap API for forecast by coordinates
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000
    });
    
    // Process the forecast data - group by day (same as /forecast endpoint)
    const forecastMap = {};
    
    response.data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!forecastMap[date]) {
        forecastMap[date] = {
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          pressure: item.main.pressure,
          rainfall: item.rain ? `${(item.rain['3h'] || 0)}mm` : '0mm'
        };
      } else {
        // Update max/min temperatures
        forecastMap[date].temp_max = Math.max(forecastMap[date].temp_max, item.main.temp_max);
        forecastMap[date].temp_min = Math.min(forecastMap[date].temp_min, item.main.temp_min);
      }
    });
    
    // Convert to array and limit to 5 days
    const forecast = Object.keys(forecastMap).map(date => ({
      date,
      ...forecastMap[date]
    })).slice(0, 5);
    
    res.json({ forecast });
  } catch (err) {
    logError('Error fetching weather forecast by coordinates', err);
    res.status(500).json({ 
      msg: 'Error fetching weather forecast by coordinates', 
      error: err.message,
      details: err.response?.data || 'No additional details'
    });
  }
});

module.exports = router;