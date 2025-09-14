const axios = require('axios');

const generateGeminiResponse = async (message, language) => {
  try {
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      contents: [{
        parts: [{
          text: `You are a knowledgeable tourism assistant for Jharkhand, India. Answer the following question:
          
Question in ${language}: "${message}"

Provide a detailed response about Jharkhand including its tourism destinations, cultural heritage, local customs, festivals, cuisine, art forms, and travel tips.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      }
    });

    return {
      text: response.data.candidates[0].content.parts[0].text,
      confidence: response.data.candidates[0].safetyRatings ? 0.9 : 0.7,
      provider: 'gemini'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};

module.exports = { generateGeminiResponse };