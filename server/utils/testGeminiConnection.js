const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Test Gemini API connection with detailed logging
async function testGeminiConnection() {
  console.log('=== Gemini API Connection Test ===');
  console.log('Environment file path:', path.resolve(__dirname, '../.env'));
  
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in environment variables');
    console.log('Please add your Gemini API key to the .env file:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    return false;
  }
  
  // Show first few characters of the API key for verification
  console.log('✓ API Key found (first 5 chars):', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
  
  try {
    // Initialize the Gemini API client
    console.log('Initializing Gemini API client...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get the model - use gemini-1.5-pro which we know works
    console.log('Using gemini-1.5-pro model...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate a simple response
    const prompt = "What are the best crops to grow in a hot and humid climate in India?";
    console.log(`Sending prompt: "${prompt}"`);
    
    console.time('Gemini API Response Time');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.timeEnd('Gemini API Response Time');
    
    console.log('\n=== Gemini API Response ===');
    console.log(text);
    console.log('\n✅ Gemini API test completed successfully!');
    
    // Save test results to a file
    const testResultsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    const testResultsPath = path.join(testResultsDir, 'gemini_test_results.txt');
    const testResults = `
=== Gemini API Test Results (${new Date().toISOString()}) ===
Prompt: ${prompt}
Response:
${text}
=== End of Test Results ===
`;
    
    fs.writeFileSync(testResultsPath, testResults);
    console.log(`Test results saved to: ${testResultsPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ ERROR testing Gemini API:', error);
    
    // Try with a different model if the first one fails
    try {
      console.log('\nTrying with alternative model gemini-1.5-flash...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "What are the best crops to grow in a hot and humid climate in India?";
      console.log(`Sending prompt: "${prompt}"`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('\n=== Gemini API Response ===');
      console.log(text);
      console.log('\n✅ Gemini API test completed successfully with alternative model!');
      return true;
    } catch (secondError) {
      console.error('❌ ERROR with alternative model:', secondError);
      console.log('\nPossible solutions:');
      console.log('1. Check if your API key is valid');
      console.log('2. Ensure you have internet connectivity');
      console.log('3. Verify that you have access to the Gemini API');
      console.log('4. Check if you have exceeded your API quota');
      console.log('5. Make sure you have enabled the Gemini API in your Google Cloud Console');
      return false;
    }
  }
}

// Run the test
testGeminiConnection().then(success => {
  if (!success) {
    console.log('\n❌ Gemini API test failed. See errors above.');
    process.exit(1);
  }
});