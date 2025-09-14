const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateOpenAIResponse = async (message, language) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    });

    return {
      text: completion.choices[0].message.content,
      confidence: completion.choices[0].finish_reason === 'stop' ? 0.9 : 0.7,
      provider: 'openai'
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
};

module.exports = { generateOpenAIResponse };