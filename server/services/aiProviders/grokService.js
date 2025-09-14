const axios = require('axios');

const generateGrokResponse = async (message, language) => {
  try {
    const response = await axios.post('https://api.grok.x.com/v1/chat/completions', {
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable tourism assistant for Jharkhand, India. Provide comprehensive and detailed information about Jharkhand's tourism, culture, and heritage."
        },
        {
          role: "user",
          content: `Question in ${language}: "${message}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      text: response.data.choices[0].message.content,
      confidence: response.data.choices[0].finish_reason === 'stop' ? 0.9 : 0.7,
      provider: 'grok'
    };
  } catch (error) {
    console.error('Grok API error:', error);
    return null;
  }
};

module.exports = { generateGrokResponse };