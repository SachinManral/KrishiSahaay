const axios = require('axios');
const OpenAI = require('openai');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get farming advice using OpenAI API
 * @param {string} query - User's query about farming
 * @param {Object} contextData - Additional context data (weather, location, etc.)
 * @returns {Promise<Object>} AI-generated farming advice
 */
const getFarmingAdvice = async (query, contextData = {}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Prepare context for the AI
    let contextPrompt = 'You are an agricultural assistant helping farmers. ';
    
    if (contextData.weather) {
      contextPrompt += `The current weather is ${contextData.weather.condition.text} with temperature ${contextData.weather.temp_c}°C and humidity ${contextData.weather.humidity}%. `;
    }
    
    if (contextData.location) {
      contextPrompt += `The location is ${contextData.location.name}, ${contextData.location.country}. `;
    }
    
    if (contextData.crop) {
      contextPrompt += `The farmer is growing ${contextData.crop}. `;
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: contextPrompt },
        { role: "user", content: query }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return {
      advice: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return {
      advice: "I'm sorry, I couldn't generate farming advice at the moment. Please try again later.",
      error: error.message
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
const getCropRecommendations = async (soilData, weatherData, locationData) => {
  try {
    // This is a scratch API implementation that would normally call an external service
    // For now, we'll use a simple rule-based system
    
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
    
    if (soilData.ph >= 5.5 && soilData.ph <= 7.0) {
      if (weatherData.current.temp_c >= 15 && weatherData.current.temp_c <= 25) {
        recommendations.push({
          crop: "Potatoes",
          confidence: 0.75,
          reasoning: "Potatoes thrive in slightly acidic soil with moderate temperatures"
        });
      }
    }
    
    // Add more crops based on location
    if (locationData.country === "India") {
      recommendations.push({
        crop: "Sugarcane",
        confidence: 0.7,
        reasoning: "Popular crop in India with good market value"
      });
    }
    
    // If no recommendations, add some defaults
    if (recommendations.length === 0) {
      recommendations.push(
        {
          crop: "Maize",
          confidence: 0.6,
          reasoning: "Adaptable to various conditions"
        },
        {
          crop: "Soybean",
          confidence: 0.55,
          reasoning: "Nitrogen-fixing crop good for soil health"
        }
      );
    }
    
    return {
      recommendations,
      soilAnalysis: {
        quality: soilData.ph > 5.5 && soilData.ph < 7.5 ? "Good" : "Needs amendment",
        recommendations: soilData.ph < 5.5 ? "Add lime to increase pH" : 
                        soilData.ph > 7.5 ? "Add sulfur to decrease pH" : 
                        "Soil pH is in a good range"
      }
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
      error: error.message
    };
  }
};

/**
 * Analyze plant disease from image
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} Disease analysis
 */
const analyzePlantDisease = async (imageBase64) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are an agricultural expert specializing in plant disease identification. Analyze the image and identify any potential diseases, pests, or nutrient deficiencies. Provide treatment recommendations."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What disease or problem does this plant have? Please provide detailed analysis and treatment recommendations." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 800
    });

    // Parse the response to extract disease name, confidence, and recommendations
    const analysisText = response.choices[0].message.content;
    
    return {
      analysis: analysisText,
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error('Plant disease analysis error:', error.message);
    return {
      analysis: "I couldn't analyze the plant image. Please ensure the image is clear and try again.",
      error: error.message
    };
  }
};

module.exports = {
  getFarmingAdvice,
  getCropRecommendations,
  analyzePlantDisease
};