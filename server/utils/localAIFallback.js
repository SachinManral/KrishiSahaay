/**
 * Local AI fallback system for when Gemini API is unavailable
 * This provides basic rule-based responses to common farming queries
 */

const cropDatabase = {
  rice: {
    waterRequirement: "High",
    soilType: "Clay or clay loam",
    growingSeason: "Kharif (monsoon)",
    diseases: ["Blast", "Bacterial leaf blight", "Sheath blight"],
    pesticides: ["Carbendazim", "Streptocycline", "Hexaconazole"],
    fertilizers: ["Urea", "DAP", "Potash"]
  },
  wheat: {
    waterRequirement: "Medium",
    soilType: "Loam or clay loam",
    growingSeason: "Rabi (winter)",
    diseases: ["Rust", "Powdery mildew", "Loose smut"],
    pesticides: ["Propiconazole", "Tebuconazole", "Carbendazim"],
    fertilizers: ["Urea", "DAP", "Zinc sulfate"]
  },
  cotton: {
    waterRequirement: "Medium",
    soilType: "Black soil, alluvial soil",
    growingSeason: "Kharif (monsoon)",
    diseases: ["Bacterial blight", "Fusarium wilt", "Root rot"],
    pesticides: ["Imidacloprid", "Thiamethoxam", "Chlorpyrifos"],
    fertilizers: ["Urea", "SSP", "Potash"]
  },
  sugarcane: {
    waterRequirement: "High",
    soilType: "Loam or clay loam",
    growingSeason: "Year-round (12-18 months)",
    diseases: ["Red rot", "Smut", "Wilt"],
    pesticides: ["Carbofuran", "Fipronil", "Chlorantraniliprole"],
    fertilizers: ["Urea", "SSP", "Potash", "Zinc sulfate"]
  },
  maize: {
    waterRequirement: "Medium",
    soilType: "Well-drained loam",
    growingSeason: "Kharif and Rabi",
    diseases: ["Leaf blight", "Rust", "Downy mildew"],
    pesticides: ["Mancozeb", "Chlorpyrifos", "Thiamethoxam"],
    fertilizers: ["Urea", "DAP", "MOP"]
  }
};

const weatherAdvice = {
  "hot": {
    irrigation: "Increase irrigation frequency",
    timing: "Irrigate during early morning or evening",
    mulching: "Apply mulch to conserve soil moisture",
    crops: ["Cotton", "Maize", "Sorghum", "Millet"]
  },
  "cold": {
    irrigation: "Reduce irrigation frequency",
    timing: "Irrigate during mid-day",
    protection: "Use row covers or tunnels for frost protection",
    crops: ["Wheat", "Barley", "Mustard", "Peas"]
  },
  "rainy": {
    drainage: "Ensure proper field drainage",
    disease: "Watch for fungal diseases",
    timing: "Avoid spraying chemicals before expected rain",
    crops: ["Rice", "Jute", "Soybean"]
  },
  "dry": {
    irrigation: "Implement drip irrigation",
    mulching: "Use plastic mulch to reduce evaporation",
    crops: ["Millet", "Sorghum", "Chickpea", "Sesame"]
  }
};

const marketPrices = {
  "rice": { min: 1800, max: 2200, unit: "per quintal" },
  "wheat": { min: 1950, max: 2300, unit: "per quintal" },
  "cotton": { min: 5500, max: 6200, unit: "per quintal" },
  "sugarcane": { min: 280, max: 350, unit: "per quintal" },
  "maize": { min: 1700, max: 2100, unit: "per quintal" },
  "soybean": { min: 3800, max: 4500, unit: "per quintal" },
  "potato": { min: 1200, max: 1800, unit: "per quintal" },
  "onion": { min: 1500, max: 2500, unit: "per quintal" },
  "tomato": { min: 1000, max: 2500, unit: "per quintal" }
};

/**
 * Simple local AI fallback for when the Gemini API is unavailable
 */

// Basic farming advice responses
const farmingResponses = {
  weather: [
    "Weather forecasts are important for planning farming activities. Check local weather services for the most accurate information.",
    "It's best to harvest crops during dry weather to prevent spoilage.",
    "Protect your crops from extreme weather conditions by using appropriate covers or shelters."
  ],
  crops: [
    "Crop rotation helps maintain soil fertility and reduces pest problems.",
    "Consider planting legumes to fix nitrogen in your soil.",
    "Intercropping can maximize land use and reduce pest pressure."
  ],
  pests: [
    "Integrated Pest Management (IPM) combines biological, cultural, and chemical methods to control pests effectively.",
    "Beneficial insects like ladybugs and praying mantises can help control pest populations naturally.",
    "Regular monitoring of your crops can help detect pest problems early."
  ],
  soil: [
    "Regular soil testing helps determine nutrient needs and pH levels.",
    "Adding organic matter improves soil structure and fertility.",
    "Cover crops can prevent soil erosion and add nutrients to the soil."
  ],
  irrigation: [
    "Drip irrigation is water-efficient and delivers water directly to plant roots.",
    "Water early in the morning to reduce evaporation losses.",
    "Mulching helps retain soil moisture and reduces watering needs."
  ],
  general: [
    "Keeping detailed records of your farming activities can help improve future decisions.",
    "Consider joining a local farming cooperative to share resources and knowledge.",
    "Sustainable farming practices can improve long-term productivity and environmental health."
  ]
};

// Keywords to match in queries
const keywords = {
  weather: ['weather', 'rain', 'temperature', 'climate', 'forecast', 'monsoon', 'drought'],
  crops: ['crop', 'plant', 'seed', 'harvest', 'grow', 'sow', 'cultivate', 'yield'],
  pests: ['pest', 'insect', 'disease', 'fungus', 'weed', 'control', 'spray', 'protect'],
  soil: ['soil', 'nutrient', 'fertilizer', 'compost', 'manure', 'organic', 'pH', 'fertility'],
  irrigation: ['water', 'irrigation', 'drip', 'sprinkler', 'moisture', 'dry', 'wet', 'canal'],
  general: []  // Fallback category
};

/**
 * Generate a response based on the user's query
 * @param {string} query - The user's question
 * @returns {string} A relevant farming advice response
 */
const generateResponse = (query) => {
  if (!query) {
    return "I'm here to help with your farming questions. What would you like to know?";
  }
  
  // Convert query to lowercase for matching
  const lowerQuery = query.toLowerCase();
  
  // Find matching category based on keywords
  let matchedCategory = 'general';
  let maxMatches = 0;
  
  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    const matches = categoryKeywords.filter(keyword => lowerQuery.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category;
    }
  }
  
  // Get responses for the matched category
  const responses = farmingResponses[matchedCategory];
  
  // Select a random response from the category
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

module.exports = {
  generateResponse
};