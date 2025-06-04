const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

async function listAvailableModels() {
  console.log('=== Listing Available Gemini Models ===');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // This is a workaround since the SDK doesn't directly expose listModels
    // We'll try a few known models to see which ones work
    const modelNames = [
      "gemini-pro",
      "gemini-1.0-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro-vision"
    ];
    
    console.log('Testing the following models:');
    console.log(modelNames.join('\n'));
    console.log('\nResults:');
    
    for (const modelName of modelNames) {
      try {
        console.log(`\nTesting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName}: AVAILABLE`);
        console.log(`Sample response: "${text.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`❌ ${modelName}: NOT AVAILABLE - ${error.message}`);
      }
    }
    
    console.log('\n=== Model Testing Complete ===');
    console.log('Please use one of the available models in your application.');
    
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listAvailableModels();