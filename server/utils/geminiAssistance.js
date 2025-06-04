// Gemini Farming Advice Handler - Enhanced Version
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');  // Add this line

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let geminiModel = null;
let isGeminiAvailable = false;
let initializationInProgress = false;

const localAI = {
  generateResponse: (query) => {
    const isHindi = /[\u0900-\u097F]/.test(query);
    const queryLower = query.toLowerCase();
    
    // Detect query topics for more relevant fallback responses
    let topicResponses = [];
    
    // Weather related queries
    if (/(weather|forecast|rain|temperature|climate|monsoon|mausam|barish|tapman)/i.test(queryLower)) {
      if (isHindi) {
        topicResponses.push("मौसम की जानकारी आपकी फसल के लिए महत्वपूर्ण है। आने वाले दिनों के मौसम की जानकारी के लिए मौसम विभाग की वेबसाइट देखें। सही समय पर सिंचाई और फसल सुरक्षा के लिए मौसम पूर्वानुमान का उपयोग करें।");
      } else {
        topicResponses.push("Weather information is crucial for your crops. Check the meteorological department website for upcoming weather forecasts. Use weather predictions for timely irrigation and crop protection measures.");
      }
    }
    
    // Market price related queries
    if (/(price|market|rate|cost|dam|bazar|kimat|mulya)/i.test(queryLower)) {
      if (isHindi) {
        topicResponses.push("बाजार मूल्य नियमित रूप से बदलते रहते हैं। वर्तमान बाजार मूल्यों के लिए, कृषि मंडी की वेबसाइट या स्थानीय कृषि कार्यालय से संपर्क करें। अपनी फसल को अधिक मूल्य पर बेचने के लिए सही समय का चयन करें।");
      } else {
        topicResponses.push("Market prices fluctuate regularly. For current market prices, check the agricultural market website or contact your local agriculture office. Choose the right timing to sell your crops for better value.");
      }
    }
    
    // Pest related queries
    if (/(pest|insect|disease|keet|rog|bimari)/i.test(queryLower)) {
      if (isHindi) {
        topicResponses.push("फसल की नियमित जांच करें और कीट या रोग के शुरुआती लक्षणों पर ध्यान दें। एकीकृत कीट प्रबंधन (IPM) तकनीकों का उपयोग करें। रासायनिक कीटनाशकों का उपयोग अंतिम विकल्प के रूप में करें।");
      } else {
        topicResponses.push("Regularly inspect your crops and watch for early signs of pests or diseases. Use Integrated Pest Management (IPM) techniques. Use chemical pesticides only as a last resort.");
      }
    }
    
    // If we have a topic-specific response, return it
    if (topicResponses.length > 0) {
      return topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }
    
    // General fallback responses if no specific topic is detected
    const hindiResponses = [
      "1. *मिट्टी की जांच* करें - यह आपकी फसल की उत्पादकता बढ़ाने में मदद करेगी।\n2. *फसल चक्र* अपनाएं - यह मिट्टी की उर्वरता बनाए रखने में सहायता करता है।\n3. *जल प्रबंधन* पर ध्यान दें - सही समय पर उचित मात्रा में सिंचाई करें।",
      "1. *उन्नत बीज* चुनें - अच्छी उपज के लिए प्रमाणित बीजों का उपयोग करें।\n2. *समय पर बुवाई* करें - फसल के अनुसार सही मौसम में बुवाई करें।\n3. *कीट प्रबंधन* अपनाएं - नियमित निरीक्षण और एकीकृत कीट प्रबंधन से फसल की सुरक्षा करें।",
      "1. *मौसम की जानकारी* रखें - फसल की बुवाई और अन्य कृषि कार्यों के लिए मौसम पूर्वानुमान का उपयोग करें।\n2. *जैविक खाद* का उपयोग करें - मिट्टी की गुणवत्ता बनाए रखने के लिए जैविक खाद का प्रयोग करें।\n3. *फसल निरीक्षण* नियमित करें - कीट और रोग के शुरुआती लक्षणों की पहचान के लिए नियमित निरीक्षण आवश्यक है।"
    ];

    const englishResponses = [
      "1. Conduct *soil testing* - This helps determine the nutrient needs of your soil and crops.\n2. Use *crop rotation* - Implementing proper crop rotation helps maintain soil fertility and reduces pest problems.\n3. Improve *irrigation methods* - Ensure proper irrigation timing and amounts based on crop requirements.",
      "1. Use *high-quality seeds* - Select certified seeds appropriate for your region and season.\n2. Follow *seasonal planting* - Plant according to the recommended calendar for your crops and region.\n3. Apply *integrated pest control* - Regular monitoring and using a combination of control methods can protect your crops effectively.",
      "1. Monitor *weather trends* - Use weather forecasts to plan planting and other agricultural activities.\n2. Use *organic fertilizers* - Using compost and other organic inputs helps maintain soil health over time.\n3. Inspect crops regularly - Check your fields frequently to identify early signs of pests and diseases."
    ];

    return isHindi
      ? hindiResponses[Math.floor(Math.random() * hindiResponses.length)]
      : englishResponses[Math.floor(Math.random() * englishResponses.length)];
  }
};

const logToFile = (message) => {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `gemini-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  console.log(`[Gemini] ${message}`);
};

const initializeGemini = async () => {
  if (initializationInProgress || geminiModel) return;
  initializationInProgress = true;
  try {
    if (!process.env.GEMINI_API_KEY) {
      logToFile('No API key provided.');
      isGeminiAvailable = false;
      return;
    }
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    await checkApiKeyValidity();
  } catch (err) {
    logToFile(`Gemini init failed: ${err.message}`);
    isGeminiAvailable = false;
  } finally {
    initializationInProgress = false;
  }
};

const checkApiKeyValidity = async () => {
  try {
    await geminiModel.generateContent('Test');
    isGeminiAvailable = true;
    logToFile('Gemini API key is valid.');
  } catch (err) {
    isGeminiAvailable = false;
    logToFile(`Invalid API key: ${err.message}`);
  }
};

const tryGenerateContent = async (prompt, retries = 2, generationConfig = {}) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });
      return await result.response.text();
    } catch (err) {
      logToFile(`Generation attempt ${attempt + 1} failed: ${err.message}`);
      
      // Check specifically for quota exceeded errors
      if (err.message.includes("quota") || err.message.includes("429")) {
        logToFile("API quota exceeded. Disabling Gemini until next restart.");
        isGeminiAvailable = false;  // Disable Gemini for this session
        throw new Error("API quota exceeded");
      }
      
      if (attempt >= retries) {
        throw err;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Gemini retries exhausted");
};

// Add a new function to fetch weather data from OpenWeatherMap
const fetchWeatherData = async (location) => {
  try {
    if (!process.env.OPENWEATHERMAP_API_KEY) {
      logToFile('No OpenWeatherMap API key found');
      return null;
    }

    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    
    logToFile(`Fetching weather data for ${location}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the weather data to match our existing structure
    const weatherData = {
      condition: {
        text: data.weather[0].description
      },
      temp_c: data.main.temp,
      humidity: data.main.humidity,
      wind_kph: (data.wind.speed * 3.6).toFixed(1), // Convert m/s to kph
      precip_mm: data.rain ? data.rain['1h'] || 0 : 0
    };
    
    // Get forecast data if needed
    const forecastData = await fetchForecastData(location);
    
    return {
      weather: weatherData,
      forecast: forecastData,
      location: {
        name: data.name,
        region: '',
        country: data.sys.country
      }
    };
  } catch (error) {
    logToFile(`Error fetching weather data: ${error.message}`);
    return null;
  }
};

// Function to fetch forecast data
const fetchForecastData = async (location) => {
  try {
    if (!process.env.OPENWEATHERMAP_API_KEY) {
      return null;
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Forecast API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the forecast data (OpenWeatherMap provides forecast in 3-hour intervals)
    // We'll group by day to get daily forecasts
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          day: {
            maxtemp_c: -Infinity,
            mintemp_c: Infinity,
            condition: { text: '' },
            daily_chance_of_rain: 0
          },
          conditions: [],
          rain_chances: []
        };
      }
      
      // Update max/min temperatures
      dailyForecasts[date].day.maxtemp_c = Math.max(dailyForecasts[date].day.maxtemp_c, item.main.temp_max);
      dailyForecasts[date].day.mintemp_c = Math.min(dailyForecasts[date].day.mintemp_c, item.main.temp_min);
      
      // Collect conditions and rain chances
      dailyForecasts[date].conditions.push(item.weather[0].description);
      dailyForecasts[date].rain_chances.push(item.pop * 100); // Probability of precipitation as percentage
    });
    
    // Process the collected data for each day
    const forecastday = Object.values(dailyForecasts).map(forecast => {
      // Find the most common condition
      const conditionCounts = {};
      forecast.conditions.forEach(condition => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      });
      
      let mostCommonCondition = '';
      let maxCount = 0;
      
      Object.entries(conditionCounts).forEach(([condition, count]) => {
        if (count > maxCount) {
          mostCommonCondition = condition;
          maxCount = count;
        }
      });
      
      // Calculate average rain chance
      const avgRainChance = forecast.rain_chances.reduce((sum, chance) => sum + chance, 0) / 
                           forecast.rain_chances.length;
      
      forecast.day.condition.text = mostCommonCondition;
      forecast.day.daily_chance_of_rain = Math.round(avgRainChance);
      
      return {
        date: forecast.date,
        day: forecast.day
      };
    });
    
    return { forecastday };
  } catch (error) {
    logToFile(`Error fetching forecast data: ${error.message}`);
    return null;
  }
};

const getFarmingAdvice = async (query, contextData = {}) => {
  if (!geminiModel) await initializeGemini();

  logToFile(`Query: ${query}`);

  const hindiPattern = /[\u0900-\u097F]/;
  const romanHindiPatterns = [/\b(kya|kaise|kab|kis|hai|kheti|pani|beej|mitti|kisan)\b/i];
  const isHindi = hindiPattern.test(query) || romanHindiPatterns.some(r => r.test(query));

  const queryLower = query.toLowerCase();
  const detectedTopics = [];
  if (/(pest|insect|keet|disease|rog)/i.test(queryLower)) detectedTopics.push("pests and diseases");
  if (/(water|irrigation|rain|pani|sinchai)/i.test(queryLower)) detectedTopics.push("water management");
  if (/(fertilizer|nutrient|khad|urea)/i.test(queryLower)) detectedTopics.push("fertilizers");
  
  // Add weather-related topic detection
  if (/(weather|forecast|rain|temperature|climate|monsoon|mausam)/i.test(queryLower)) {
    detectedTopics.push("weather forecast");
  }

  // If weather is requested but not provided in contextData, try to fetch it
  if (detectedTopics.includes("weather forecast") && (!contextData.weather || !contextData.forecast)) {
    // Extract location from query or use default
    let location = "Delhi, India"; // Default location
    
    // Try to extract location from query
    const locationMatch = queryLower.match(/(?:in|at|for)\s+([a-z\s]+)(?:\?|$)/i);
    if (locationMatch && locationMatch[1]) {
      location = locationMatch[1].trim();
    } else if (contextData.location?.name) {
      location = contextData.location.name;
    }
    
    // Fetch weather data
    const weatherData = await fetchWeatherData(location);
    if (weatherData) {
      contextData = { ...contextData, ...weatherData };
    }
  }

  if (!isGeminiAvailable) {
    logToFile('Gemini unavailable, using local fallback');
    return { advice: localAI.generateResponse(query), source: 'local-fallback', model: 'local' };
  }

  try {
    let prompt = `You are KrishiSahaay, an agricultural expert.\n\n`;
    prompt += isHindi ?
      `- Respond in HINDI using correct terms\n` :
      `- Respond in clear English\n`;
    prompt += `\nIMPORTANT: Be specific, structured, and educational.\n\n`;
    if (detectedTopics.length > 0) {
      prompt += `Topics: ${detectedTopics.join(", ")}\n`;
    }
    if (contextData.weather?.condition?.text && contextData.weather?.temp_c != null) {
      prompt += `Weather: ${contextData.weather.condition.text}, ${contextData.weather.temp_c}°C\n`;
    }
    if (contextData.location?.name) {
      prompt += `Location: ${contextData.location.name}, ${contextData.location.region}\n`;
    }
    if (contextData.crop) {
      prompt += `Crop: ${contextData.crop}\n`;
    }

    prompt += `\nFarmer's question: ${query}\n\n`;
    prompt += isHindi ? "उत्तर हिंदी में दें:" : "Answer in English:";

    const generationConfig = {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000
    };

    const responseText = await tryGenerateContent(prompt, 2, generationConfig);

    return {
      advice: responseText,
      model: "gemini-1.5-pro",
      source: "gemini",
      language: isHindi ? "hindi" : "english",
      topics: detectedTopics
    };
  } catch (error) {
    logToFile(`Gemini failed, falling back: ${error.message}`);
    return {
      advice: localAI.generateResponse(query),
      model: "local-fallback",
      source: "local",
      error: error.message
    };
  }
};

initializeGemini();

module.exports = {
  getFarmingAdvice,
  initializeGemini,
  fetchWeatherData  // Export the weather function for use elsewhere
};