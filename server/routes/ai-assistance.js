const express = require('express');
const router = express.Router();
const geminiAssistance = require('../utils/geminiAssistance');
const auth = require('../middleware/auth');

// @route   POST api/ai-assistance/farming-advice
// @desc    Get AI-powered farming advice
// @access  Public
router.post('/farming-advice', async (req, res) => {
  try {
    const { query, weather, location, crop } = req.body;
    
    if (!query) {
      return res.status(400).json({ msg: 'Query is required' });
    }
    
    console.log('Received farming advice request:', query);
    
    // Add request timestamp for debugging
    const requestTime = new Date().toISOString();
    console.log(`Request time: ${requestTime}`);
    
    const advice = await geminiAssistance.getFarmingAdvice(query, { weather, location, crop });
    
    // Add source information to the response
    if (advice.source === 'local') {
      console.log('Sending local AI response');
    } else {
      console.log('Sending Gemini response');
    }
    
    // Add response timestamp for debugging
    const responseTime = new Date().toISOString();
    console.log(`Response time: ${responseTime}`);
    console.log(`Response processing time: ${new Date(responseTime) - new Date(requestTime)}ms`);
    
    // Ensure we always return a valid response object but don't include source in the client response
    res.json({
      advice: advice.advice || "I'm sorry, I couldn't generate a response at the moment.",
      // Remove source and model from the response sent to client
      requestTime,
      responseTime
    });
  } catch (err) {
    console.error('Farming advice error:', err.message);
    
    // Return a fallback response with 200 status to ensure client can display it
    res.status(200).json({ 
      advice: "I'm sorry, I couldn't process your request at the moment. Please try again later.",
      // Remove source and model from the error response
    });
  }
});

// @route   POST api/ai-assistance/farming-tips
// @desc    Get AI-powered farming tips based on weather data
// @access  Public
router.post('/farming-tips', async (req, res) => {
  try {
    const { weatherData, location } = req.body;
    
    if (!weatherData) {
      return res.status(400).json({ msg: 'Weather data is required' });
    }
    
    console.log('Received request for AI farming tips:', location);
    
    // Get current season based on month in India
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let season = '';
    
    // Indian seasonal calendar
    if (currentMonth >= 3 && currentMonth <= 5) {
      season = 'summer';
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      season = 'monsoon';
    } else if (currentMonth >= 10 && currentMonth <= 11) {
      season = 'post-monsoon';
    } else {
      season = 'winter';
    }
    
    // Prepare context for the AI model
    const contextData = {
      weather: weatherData.current,
      location: { name: location },
      season: season,
      forecast: weatherData.forecast
    };
    
    // Use Gemini to generate personalized farming tips
    const prompt = `Based on the following weather data, provide 3-4 specific farming tips tailored to the current conditions and season.
    
    Location: ${location}
    Current Weather: ${weatherData.current.temp}°C, ${weatherData.current.condition} (${weatherData.current.description})
    Humidity: ${weatherData.current.humidity}%
    Wind Speed: ${weatherData.current.wind_speed} km/h
    Season: ${season}
    
    Forecast:
    ${weatherData.forecast.map(day => 
      `${day.date}: ${day.temp_min}°C to ${day.temp_max}°C, ${day.condition}`
    ).join('\n')}
    
    Format your response as a JSON object with the following structure:
    {
      "tips": [
        {
          "title": "Short title for the tip",
          "content": "Detailed farming advice (1-2 sentences)",
          "category": "Category like Water Management, Pest Control, etc.",
          "icon": "Font Awesome icon class (e.g., fas fa-tint for water)"
        }
      ],
      "cropRecommendations": [
        {
          "name": "Crop name",
          "confidence": Percentage match for current conditions (number between 0-100)
        }
      ]
    }`;
    
    // Get AI response
    const aiResponse = await geminiAssistance.getFarmingAdvice(prompt, contextData);
    
    // Parse the JSON response from the AI
    let parsedResponse;
    try {
      // Extract JSON from the AI response (it might be wrapped in text)
      const jsonMatch = aiResponse.advice.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a fallback response
        parsedResponse = {
          tips: [
            {
              title: "AI Generated Tip",
              content: aiResponse.advice.substring(0, 200) + "...",
              category: "General Advice",
              icon: "fas fa-leaf"
            }
          ]
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Create a fallback response with the raw AI text
      parsedResponse = {
        tips: [
          {
            title: "Farming Recommendation",
            content: aiResponse.advice.substring(0, 200) + "...",
            category: "AI Advice",
            icon: "fas fa-seedling"
          }
        ]
      };
    }
    
    // Add some standard tips based on weather conditions
    const standardTips = getStandardTips(weatherData, season);
    
    // Combine AI tips with standard tips if needed
    if (!parsedResponse.tips || parsedResponse.tips.length < 2) {
      parsedResponse.tips = [
        ...(parsedResponse.tips || []),
        ...standardTips.slice(0, 3 - (parsedResponse.tips?.length || 0))
      ];
    }
    
    // Add crop recommendations if not provided by AI
    if (!parsedResponse.cropRecommendations) {
      parsedResponse.cropRecommendations = getSeasonalCropRecommendations(season, weatherData);
    }
    
    res.json(parsedResponse);
  } catch (err) {
    console.error('Error generating AI farming tips:', err.message);
    
    // Return fallback tips
    res.status(200).json({
      tips: [
        {
          title: "Weather-Based Recommendation",
          content: "Monitor current weather patterns and adjust farming operations accordingly. Regular crop monitoring helps identify issues early.",
          category: "General Advice",
          icon: "fas fa-cloud-sun"
        },
        {
          title: "Seasonal Planning",
          content: `Focus on ${getCurrentSeasonalFocus()} during this time of year. Adjust your farming activities to match the seasonal patterns.`,
          category: "Seasonal",
          icon: "fas fa-calendar-alt"
        }
      ],
      cropRecommendations: getDefaultCropRecommendations()
    });
  }
});

// Helper function to get standard tips based on weather
function getStandardTips(weatherData, season) {
  const tips = [];
  const temp = weatherData.current.temp;
  const condition = weatherData.current.condition.toLowerCase();
  
  // Temperature-based tips
  if (temp > 35) {
    tips.push({
      title: "Heat Management",
      content: "Increase irrigation frequency and water during early morning. Provide shade for sensitive crops.",
      category: "Temperature",
      icon: "fas fa-temperature-high"
    });
  } else if (temp < 10) {
    tips.push({
      title: "Cold Protection",
      content: "Protect sensitive crops from frost. Consider row covers and delay fertilizer application.",
      category: "Temperature",
      icon: "fas fa-snowflake"
    });
  }
  
  // Condition-based tips
  if (condition.includes('rain')) {
    tips.push({
      title: "Rainfall Management",
      content: "Ensure proper drainage and postpone fertilizer application. Monitor for increased disease pressure.",
      category: "Precipitation",
      icon: "fas fa-cloud-rain"
    });
  } else if (condition.includes('clear') && weatherData.current.humidity < 40) {
    tips.push({
      title: "Dry Conditions",
      content: "Increase irrigation and apply mulch to retain soil moisture. Monitor for signs of water stress.",
      category: "Moisture",
      icon: "fas fa-tint-slash"
    });
  }
  
  // Season-specific tips
  if (season === 'summer') {
    tips.push({
      title: "Summer Management",
      content: "Focus on heat stress prevention and water conservation. Irrigate during early morning or evening.",
      category: "Seasonal",
      icon: "fas fa-sun"
    });
  } else if (season === 'monsoon') {
    tips.push({
      title: "Monsoon Management",
      content: "Focus on disease prevention and proper drainage. Monitor for fungal infections in high humidity.",
      category: "Seasonal",
      icon: "fas fa-cloud-showers-heavy"
    });
  } else if (season === 'winter') {
    tips.push({
      title: "Winter Management",
      content: "Protect crops from cold and frost. Adjust irrigation timing to warmer parts of the day.",
      category: "Seasonal",
      icon: "fas fa-icicles"
    });
  }
  
  return tips;
}

// Helper function to get seasonal crop recommendations
function getSeasonalCropRecommendations(season, weatherData) {
  switch (season) {
    case 'summer':
      return [
        { name: "Okra (Bhindi)", confidence: 95 },
        { name: "Bottle Gourd (Lauki)", confidence: 90 },
        { name: "Cucumber", confidence: 85 },
        { name: "Watermelon", confidence: 80 },
        { name: "Mung Bean", confidence: 75 }
      ];
    case 'monsoon':
      return [
        { name: "Rice", confidence: 95 },
        { name: "Maize", confidence: 90 },
        { name: "Soybean", confidence: 85 },
        { name: "Black Gram (Urad)", confidence: 80 },
        { name: "Green Gram (Moong)", confidence: 75 }
      ];
    case 'post-monsoon':
      return [
        { name: "Mustard", confidence: 95 },
        { name: "Chickpea (Chana)", confidence: 90 },
        { name: "Wheat", confidence: 85 },
        { name: "Spinach", confidence: 80 },
        { name: "Fenugreek (Methi)", confidence: 75 }
      ];
    case 'winter':
      return [
        { name: "Wheat", confidence: 95 },
        { name: "Mustard", confidence: 90 },
        { name: "Peas", confidence: 85 },
        { name: "Potato", confidence: 80 },
        { name: "Carrot", confidence: 75 }
      ];
    default:
      return [
        { name: "Rice", confidence: 80 },
        { name: "Wheat", confidence: 75 },
        { name: "Maize", confidence: 70 },
        { name: "Pulses", confidence: 65 },
        { name: "Vegetables", confidence: 60 }
      ];
  }
}

function getCurrentSeasonalFocus() {
  const currentMonth = new Date().getMonth() + 1;
  
  if (currentMonth >= 3 && currentMonth <= 5) {
    return "heat management and water conservation";
  } else if (currentMonth >= 6 && currentMonth <= 9) {
    return "disease prevention and drainage management";
  } else if (currentMonth >= 10 && currentMonth <= 11) {
    return "harvesting kharif crops and preparing for rabi season";
  } else {
    return "cold protection and optimal irrigation timing";
  }
}

function getDefaultCropRecommendations() {
  const currentMonth = new Date().getMonth() + 1;
  
  if (currentMonth >= 3 && currentMonth <= 5) {
    return [
      { name: "Okra", confidence: 85 },
      { name: "Cucumber", confidence: 80 },
      { name: "Bottle Gourd", confidence: 75 }
    ];
  } else if (currentMonth >= 6 && currentMonth <= 9) {
    return [
      { name: "Rice", confidence: 85 },
      { name: "Maize", confidence: 80 },
      { name: "Soybean", confidence: 75 }
    ];
  } else if (currentMonth >= 10 && currentMonth <= 11) {
    return [
      { name: "Mustard", confidence: 85 },
      { name: "Chickpea", confidence: 80 },
      { name: "Wheat", confidence: 75 }
    ];
  } else {
    return [
      { name: "Wheat", confidence: 85 },
      { name: "Potato", confidence: 80 },
      { name: "Peas", confidence: 75 }
    ];
  }
}

module.exports = router;