const { generateOpenAIResponse } = require('./aiProviders/openAIService');
const { generateDeepSeekResponse } = require('./aiProviders/deepSeekService');
const { generateGrokResponse } = require('./aiProviders/grokService');
const { generateGeminiResponse } = require('./aiProviders/geminiService');
const { analyzeResponses } = require('./aiProviders/responseAnalyzer');

const getMultiProviderResponse = async (message, language) => {
  try {
    // Get responses from all AI providers in parallel
    const responses = await Promise.allSettled([
      generateOpenAIResponse(message, language),
      generateDeepSeekResponse(message, language),
      generateGrokResponse(message, language),
      generateGeminiResponse(message, language)
    ]);

    // Filter successful responses
    const validResponses = responses
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    // Analyze and select the best response
    const bestResponse = analyzeResponses(validResponses);

    if (!bestResponse) {
      throw new Error('No valid responses from AI providers');
    }

    return {
      message: bestResponse.text,
      provider: bestResponse.provider,
      confidence: bestResponse.confidence,
      context: {
        aiProvider: bestResponse.provider,
        responseQuality: bestResponse.score
      }
    };
  } catch (error) {
    console.error('Multi-provider response error:', error);
    return {
      message: language === 'hi' 
        ? 'क्षमा करें, एक त्रुटि हुई है। कृपया पुनः प्रयास करें।' 
        : 'Sorry, there was an error. Please try again.',
      provider: 'fallback',
      confidence: 0,
      context: { error: true }
    };
  }
};

module.exports = { getMultiProviderResponse };