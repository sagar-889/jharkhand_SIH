const axios = require('axios');

// Create an axios instance with sensible defaults
const deepseekClient = axios.create({
  baseURL: 'https://api.deepseek.com/v1',
  timeout: 10000, // 10s timeout
  headers: { 'Content-Type': 'application/json' }
});

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const generateDeepSeekResponse = async (message, language) => {
  const payload = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'You are a knowledgeable tourism assistant for Jharkhand, India. Provide comprehensive and detailed information about Jharkhand\'s tourism, culture, and heritage.'
      },
      {
        role: 'user',
        content: `Question in ${language}: "${message}"`
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  const maxAttempts = 2;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxAttempts) {
    try {
      const res = await deepseekClient.post('/chat/completions', payload, {
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }
      });

      // Basic validation of expected response shape
      const data = res && res.data;
      if (!data) {
        console.error('DeepSeek API returned empty response body');
        return null;
      }

      // Try multiple possible paths for text depending on provider response shape
      const choice = data.choices && data.choices[0];
      const text = choice?.message?.content || data.text || choice?.text || '';

      if (!text || text.trim().length === 0) {
        console.error('DeepSeek API returned unexpected shape:', JSON.stringify(data).slice(0, 1000));
        return null;
      }

      const confidence = (choice && choice.finish_reason === 'stop') ? 0.9 : 0.7;

      return {
        text: text,
        confidence,
        provider: 'deepseek'
      };
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      // Retry on 5xx server errors
      if (status && status >= 500 && attempt + 1 < maxAttempts) {
        attempt++;
        const delay = 300 * attempt;
        console.warn(`DeepSeek API server error (status=${status}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // For other errors, log useful info and return null
      console.error('DeepSeek API error:', {
        message: err.message,
        status: err?.response?.status,
        body: err?.response?.data ? JSON.stringify(err.response.data).slice(0, 1000) : undefined
      });
      return null;
    }
  }

  console.error('DeepSeek API failed after retries:', lastError);
  return null;
};

module.exports = { generateDeepSeekResponse };