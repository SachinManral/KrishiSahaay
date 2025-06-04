const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const localAI = require('./localAIFallback');

// Ensure environment variables are loaded
dotenv.config();

// Track Gemini API availability
let isGeminiAvailable = true;

// Initialize Gemini client with error handling
let genAI;
let geminiModel;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Gemini AI client initialized successfully');
  } else {
    console.warn('GEMINI_API_KEY not found in environment variables');
    isGeminiAvailable = false;
  }
} catch (error) {
  console.error('Error initializing Gemini AI client:', error.message);
  isGeminiAvailable = false;
}

// Function to check API key validity
const checkApiKeyValidity = async () => {
  if (!process.env.GEMINI_API_KEY || !genAI || !geminiModel) {
    return false;
  }
  
  try {
    // Make a minimal API call to test the key
    const result = await geminiModel.generateContent("Hello");
    const response = await result.response;
    
    isGeminiAvailable = true;
    return true;
  } catch (error) {
    console.error('Gemini API key validation failed:', error.message);
    isGeminiAvailable = false;
    return false;
  }
};

/**
 * Get farming advice using Gemini AI API or local fallback
 * @param {string} query - User's query about farming
 * @param {Object} contextData - Additional context data (weather, location, etc.)
 * @returns {Promise<Object>} AI-generated farming advice
 */
const getFarmingAdvice = async (query, contextData = {}) => {
  // If we already know Gemini is unavailable, use local fallback immediately
  if (!isGeminiAvailable || !process.env.GEMINI_API_KEY || !geminiModel) {
    console.log('Using local AI fallback (Gemini unavailable)');
    const advice = localAI.generateResponse(query);
    return {
      advice,
      model: "local-fallback",
      source: "local"
    };
  }

  try {
    // Verify API key is still valid
    if (!await checkApiKeyValidity()) {
      console.log('Gemini API key invalid or quota exceeded, using local fallback');
      const advice = localAI.generateResponse(query);
      return {
        advice,
        model: "local-fallback",
        source: "local"
      };
    }
    
    // Prepare context for the AI
    let contextPrompt = 'You are an agricultural assistant helping farmers in India. Provide concise, practical advice. ';
    
    if (contextData.weather) {
      contextPrompt += `The current weather is ${contextData.weather.condition.text} with temperature ${contextData.weather.temp_c}°C and humidity ${contextData.weather.humidity}%. `;
    }
    
    if (contextData.location) {
      contextPrompt += `The location is ${contextData.location.name}, ${contextData.location.country}. `;
    }
    
    if (contextData.crop) {
      contextPrompt += `The farmer is growing ${contextData.crop}. `;
    }

    console.log('Sending query to Gemini:', query);
    
    // Call Gemini API
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 500,
    };

    const chat = geminiModel.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: contextPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll provide helpful agricultural advice for farmers in India." }],
        },
      ],
    });

    const result = await chat.sendMessage(query);
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini');
    
    return {
      advice: text,
      model: "gemini-pro",
      source: "gemini"
    };
  } catch (err) {
    console.error('Gemini API error:', err.message);
    
    // Mark Gemini as unavailable for future requests
    isGeminiAvailable = false;
    
    // Use local fallback
    const advice = localAI.generateResponse(query);
    return {
      advice,
      model: "local-fallback",
      source: "local",
      error: err.message
    };
  }
};

/**
 * Get crop recommendations based on soil and weather data
 * @param {Object} soilData - Soil characteristics
 * @param {Object} weatherData - Weather forecast
 * @param {Object} locationData - Location information
 * @returns {Promise<Object>} Crop recommendations
 */
const getCropRecommendations = async (soilData, weatherData, locationData = {}) => {
  if (!isGeminiAvailable) {
    // Use the existing rule-based system as fallback
    try {
      const recommendations = [];
      
      // Simple rule-based recommendations
      if (soilData.ph >= 6.0 && soilData.ph <= 7.5) {
        if (weatherData.current.temp_c >= 20 && weatherData.current.temp_c <= 30) {
          recommendations.push({
            crop: "Rice",
            confidence: 0.85,
            reasoning: "Suitable pH and temperature range for rice cultivation"
          });
        }
        
        if (weatherData.current.temp_c >= 18 && weatherData.current.temp_c <= 27) {
          recommendations.push({
            crop: "Wheat",
            confidence: 0.8,
            reasoning: "Good temperature range and soil pH for wheat"
          });
        }
      }
      
      // ... rest of the rule-based system ...
      
      return {
        recommendations,
        soilAnalysis: {
          quality: soilData.ph > 5.5 && soilData.ph < 7.5 ? "Good" : "Needs amendment",
          recommendations: soilData.ph < 5.5 ? "Add lime to increase pH" : 
                          soilData.ph > 7.5 ? "Add sulfur to decrease pH" : 
                          "Soil pH is in a good range"
        },
        source: "local"
      };
    } catch (error) {
      console.error('Crop recommendation error:', error.message);
      return {
        recommendations: [
          {
            crop: "Maize",
            confidence: 0.6,
            reasoning: "Generally adaptable to various conditions"
          }
        ],
        error: error.message,
        source: "local"
      };
    }
  }

  try {
    // Prepare prompt for crop recommendations
    const prompt = `Based on the following soil and weather data, recommend suitable crops for farming in ${locationData.country || 'India'}.
    
    Soil Data:
    - pH: ${soilData.ph}
    - Nitrogen: ${soilData.nitrogen} kg/ha
    - Phosphorus: ${soilData.phosphorus} kg/ha
    - Potassium: ${soilData.potassium} kg/ha
    - Organic Matter: ${soilData.organicMatter || 'Unknown'}%
    - Texture: ${soilData.texture || 'Unknown'}
    
    Weather Data:
    - Current Temperature: ${weatherData.current.temp_c}°C
    - Humidity: ${weatherData.current.humidity}%
    - Precipitation: ${weatherData.current.precip_mm} mm
    - Season: ${weatherData.current.season || 'Current season'}
    
    Please provide:
    1. Top 5 recommended crops with reasoning
    2. Expected yield per hectare
    3. Optimal planting time
    4. Any special considerations for these crops`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      recommendations: text,
      source: "gemini",
      model: "gemini-pro"
    };
  } catch (err) {
    console.error('Error getting crop recommendations:', err.message);
    isGeminiAvailable = false;
    
    // Fall back to rule-based system
    return getCropRecommendations(soilData, weatherData, locationData);
  }
};

/**
 * Analyze plant disease from image
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} Disease analysis
 */
const analyzePlantDisease = async (imageBase64) => {
  if (!isGeminiAvailable) {
    return {
      analysis: "I couldn't analyze the plant image. Please ensure the image is clear and try again.",
      source: "local"
    };
  }

  try {
    // For image analysis, we need to use the vision model
    const visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Convert base64 to the format expected by Gemini
    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };
    
    const prompt = "Analyze this plant image and identify any diseases or issues. Provide: 1) Disease name if present, 2) Severity level, 3) Recommended treatment, 4) Preventive measures for the future.";
    
    const result = await visionModel.generateContent([prompt, imageData]);
    const response = await result.response;
    const analysis = response.text();
    
    return {
      analysis,
      source: "gemini",
      model: "gemini-pro-vision"
    };
  } catch (err) {
    console.error('Error analyzing plant disease:', err.message);
    return {
      analysis: "I couldn't analyze the plant image. Please ensure the image is clear and try again.",
      source: "local",
      error: err.message
    };
  }
};

module.exports = {
  getFarmingAdvice,
  getCropRecommendations,
  analyzePlantDisease,
  checkApiKeyValidity
};