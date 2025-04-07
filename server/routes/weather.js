const express = require('express');
const router = express.Router();
const axios = require('axios');
const Weather = require('../models/Weather'); // Add this line

// Add a test route
router.get('/test', (req, res) => {
  res.json({ msg: 'Weather API is working', apiKey: process.env.WEATHER_API_KEY ? 'API key is set' : 'API key is missing' });
});

// Mock data generator for weather
const getMockWeatherData = (location) => {
  return {
    "coord": {
      "lon": 77.2,
      "lat": 28.6
    },
    "weather": [
      {
        "id": 800,
        "main": "Clear",
        "description": "clear sky",
        "icon": "01d"
      }
    ],
    "base": "stations",
    "main": {
      "temp": 30.5,
      "feels_like": 29.8,
      "temp_min": 28.9,
      "temp_max": 32.1,
      "pressure": 1012,
      "humidity": 45
    },
    "visibility": 10000,
    "wind": {
      "speed": 3.6,
      "deg": 270
    },
    "clouds": {
      "all": 0
    },
    "dt": 1621152000,
    "sys": {
      "type": 1,
      "id": 9165,
      "country": "IN",
      "sunrise": 1621121400,
      "sunset": 1621170600
    },
    "timezone": 19800,
    "id": 1273294,
    "name": location || "Delhi",
    "cod": 200
  };
};

// Mock data generator for forecast
const getMockForecastData = (location) => {
  return {
    "cod": "200",
    "message": 0,
    "cnt": 40,
    "list": Array(40).fill().map((_, i) => ({
      "dt": 1621152000 + i * 10800,
      "main": {
        "temp": 28 + Math.random() * 5,
        "feels_like": 27 + Math.random() * 5,
        "temp_min": 26 + Math.random() * 3,
        "temp_max": 30 + Math.random() * 3,
        "pressure": 1010 + Math.random() * 10,
        "humidity": 40 + Math.random() * 20
      },
      "weather": [
        {
          "id": 800,
          "main": ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
          "description": "weather condition",
          "icon": ["01d", "02d", "10d"][Math.floor(Math.random() * 3)]
        }
      ],
      "clouds": {
        "all": Math.floor(Math.random() * 100)
      },
      "wind": {
        "speed": 1 + Math.random() * 5,
        "deg": Math.floor(Math.random() * 360)
      },
      "visibility": 10000,
      "pop": Math.random(),
      "dt_txt": new Date(1621152000000 + i * 10800000).toISOString().split('.')[0].replace('T', ' ')
    })),
    "city": {
      "id": 1273294,
      "name": location || "Delhi",
      "coord": {
        "lat": 28.6,
        "lon": 77.2
      },
      "country": "IN",
      "timezone": 19800,
      "sunrise": 1621121400,
      "sunset": 1621170600
    }
  };
};

// Coordinates routes
router.get('/coordinates', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ msg: 'Latitude and longitude are required' });
    }
    
    // Check if we have recent cached data in MongoDB
    const cachedWeather = await Weather.findOne({
      'location.coordinates.lat': parseFloat(lat),
      'location.coordinates.lon': parseFloat(lon),
      expiresAt: { $gt: new Date() }
    }).sort({ lastUpdated: -1 });
    
    if (cachedWeather) {
      console.log('Using cached weather data from MongoDB');
      return res.json({
        name: cachedWeather.location.name,
        sys: { country: cachedWeather.location.country },
        main: {
          temp: cachedWeather.current.temp_c,
          humidity: cachedWeather.current.humidity
        },
        weather: [{
          main: cachedWeather.current.condition.text,
          icon: cachedWeather.current.condition.icon.split('/').pop().split('@')[0]
        }],
        wind: {
          speed: cachedWeather.current.wind_kph / 3.6 // Convert km/h to m/s
        },
        rain: cachedWeather.current.precip_mm ? { '1h': cachedWeather.current.precip_mm } : undefined,
        coord: { lat: parseFloat(lat), lon: parseFloat(lon) },
        cod: 200
      });
    }
    
    // Using OpenWeatherMap API
    const apiKey = process.env.WEATHER_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.error('OpenWeatherMap API key is missing');
      const mockData = getMockWeatherData("Your Location");
      return res.json(mockData);
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    
    try {
      const response = await axios.get(url);
      res.json(response.data);
    } catch (apiErr) {
      console.error('OpenWeatherMap API Error:', apiErr.response?.data || apiErr.message);
      // Return mock data if API call fails
      const mockData = getMockWeatherData("Your Location");
      res.json(mockData);
    }
  } catch (err) {
    console.error('Weather API Error:', err.message);
    // Return mock data instead of error to prevent frontend from breaking
    const mockData = getMockWeatherData("Your Location");
    res.json(mockData);
  }
});

// Forecast coordinates route
router.get('/coordinates/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ msg: 'Latitude and longitude are required' });
    }
    
    // Check if we have recent cached data in MongoDB
    const cachedWeather = await Weather.findOne({
      'location.coordinates.lat': parseFloat(lat),
      'location.coordinates.lon': parseFloat(lon),
      expiresAt: { $gt: new Date() }
    }).sort({ lastUpdated: -1 });
    
    if (cachedWeather) {
      console.log('Using cached forecast data from MongoDB');
      return res.json({
        forecast: cachedWeather.forecast.map(day => ({
          date: day.date,
          temp_max: day.day.maxtemp_c,
          temp_min: day.day.mintemp_c,
          description: day.day.condition.text,
          icon: day.day.condition.icon.split('/').pop().split('@')[0],
          humidity: day.day.avghumidity
        }))
      });
    }
    
    // Using OpenWeatherMap API
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    
    try {
      const response = await axios.get(url);
      
      // Process the forecast data to match our expected format
      const forecastData = {
        forecast: response.data.list.filter((item, index) => index % 8 === 0).slice(0, 5).map(item => ({
          date: item.dt_txt.split(' ')[0],
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          description: item.weather[0].main,
          icon: item.weather[0].icon,
          humidity: item.main.humidity
        }))
      };
      
      // Get the current weather data to store together with forecast
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const currentWeatherResponse = await axios.get(currentWeatherUrl);
      
      // Store both current and forecast data in MongoDB
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour
        
        const weatherData = new Weather({
          location: {
            name: currentWeatherResponse.data.name,
            country: currentWeatherResponse.data.sys.country,
            coordinates: {
              lat: parseFloat(lat),
              lon: parseFloat(lon)
            }
          },
          current: {
            temp_c: currentWeatherResponse.data.main.temp,
            condition: {
              text: currentWeatherResponse.data.weather[0].main,
              icon: `https://openweathermap.org/img/wn/${currentWeatherResponse.data.weather[0].icon}@4x.png`
            },
            humidity: currentWeatherResponse.data.main.humidity,
            wind_kph: currentWeatherResponse.data.wind.speed * 3.6, // Convert m/s to km/h
            precip_mm: currentWeatherResponse.data.rain ? currentWeatherResponse.data.rain['1h'] : 0
          },
          forecast: forecastData.forecast.map(item => ({
            date: item.date,
            day: {
              maxtemp_c: item.temp_max,
              mintemp_c: item.temp_min,
              condition: {
                text: item.description,
                icon: `https://openweathermap.org/img/wn/${item.icon}@4x.png`
              },
              daily_chance_of_rain: 0,
              avghumidity: item.humidity
            }
          })),
          lastUpdated: new Date(),
          expiresAt
        });
        
        await weatherData.save();
        console.log('Weather data cached in MongoDB');
      } catch (dbErr) {
        console.error('Error caching weather data:', dbErr);
      }
      
      res.json(forecastData);
    } catch (apiErr) {
      console.log('Using mock forecast data due to API error:', apiErr.message);
      // Return mock data if API call fails
      const mockData = {
        forecast: Array(5).fill().map((_, i) => ({
          date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
          temp_max: 28 + Math.random() * 5,
          temp_min: 20 + Math.random() * 5,
          description: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
          icon: ["01d", "02d", "10d"][Math.floor(Math.random() * 3)],
          humidity: 40 + Math.random() * 20
        }))
      };
      res.json(mockData);
    }
  } catch (err) {
    console.error('Weather Forecast API Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Location forecast route
router.get('/forecast/:location', async (req, res) => {
  try {
    const location = req.params.location;
    
    // Using OpenWeatherMap API
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    
    try {
      const response = await axios.get(url);
      
      // Process the forecast data to match our expected format
      const forecastData = {
        forecast: response.data.list.filter((item, index) => index % 8 === 0).slice(0, 5).map(item => ({
          date: item.dt_txt.split(' ')[0],
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          description: item.weather[0].main,
          icon: item.weather[0].icon,
          humidity: item.main.humidity
        }))
      };
      
      res.json(forecastData);
    } catch (apiErr) {
      console.error("❌ OpenWeatherMap API Error:", apiErr.response?.data || apiErr.message);
      console.log('⚠️  Using mock forecast data due to API error.');
      const mockData = getMockForecastData(location);
      res.json(mockData);
    }
  } catch (err) {
    console.error('Location Forecast API Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Location weather route
router.get('/:location', async (req, res) => {
  try {
    const location = req.params.location;
    
    // Using OpenWeatherMap API
    const apiKey = process.env.WEATHER_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.error('OpenWeatherMap API key is missing');
      const mockData = getMockWeatherData(location);
      return res.json(mockData);
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    
    try {
      const response = await axios.get(url);
      res.json(response.data);
    } catch (apiErr) {
      console.error('OpenWeatherMap API Error:', apiErr.response?.data || apiErr.message);
      // Return mock data if API call fails
      const mockData = getMockWeatherData(location);
      res.json(mockData);
    }
  } catch (err) {
    console.error('Location Weather API Error:', err.message);
    // Return mock data instead of error to prevent frontend from breaking
    const mockData = getMockWeatherData(location);
    res.json(mockData);
  }
});

module.exports = router;