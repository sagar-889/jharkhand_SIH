const Destination = require('../models/Destination');
const Product = require('../models/Product');
const { getWeatherData } = require('./weatherService');
const { translateText } = require('./translationService');
const { generateOpenAIResponse } = require('./aiProviders/openAIService');
const { generateDeepSeekResponse } = require('./aiProviders/deepSeekService');
const { generateGrokResponse } = require('./aiProviders/grokService');
const { generateGeminiResponse } = require('./aiProviders/geminiService');
const { analyzeResponses } = require('./aiProviders/responseAnalyzer');

// @desc    Process chat message and generate response
exports.processChatMessage = async (params) => {
  try {
    const { message, sessionId, language = 'en', context = {}, user } = params;

    // Detect intent and entities
    const { intent, entities, confidence } = await detectIntent(message, language);

    // Get response based on intent
    let response = await generateResponse({
      message,
      intent,
      entities,
      language,
      context,
      user,
      sessionId
    });

    // Translate response if needed
    if (language !== 'en') {
      response.message = await translateText(response.message, language, 'en');
    }

    // Generate suggestions and quick replies
    const suggestions = await generateSuggestions(intent, entities, language);
    const quickReplies = await generateQuickReplies(intent, language);

    return {
      message: response.message,
      intent: intent,
      entities: entities,
      suggestions: suggestions,
      quickReplies: quickReplies,
      context: response.context || context,
      attachments: response.attachments || [],
      confidence: confidence
    };
  } catch (error) {
    console.error('Process chat message error:', error);
    return {
      message: language === 'hi' ? 'क्षमा करें, कुछ त्रुटि हुई है। कृपया पुनः प्रयास करें।' : 'Sorry, there was an error. Please try again.',
      intent: 'error',
      entities: {},
      suggestions: [],
      quickReplies: [],
      context: context,
      attachments: [],
      confidence: 0
    };
  }
};

// @desc    Detect intent and entities from message
const detectIntent = async (message, language) => {
  try {
    const prompt = `
Analyze the following message and determine the intent and extract entities. Respond in JSON format.

Message: "${message}"
Language: ${language}

Possible intents:
- greeting: User is greeting or saying hello
- destination_info: User wants information about destinations
- itinerary_planning: User wants help planning an itinerary
- booking: User wants to make a booking
- weather: User is asking about weather
- transport: User is asking about transportation
- food: User is asking about food recommendations
- accommodation: User is asking about places to stay
- events: User is asking about events or festivals
- emergency: User needs emergency help
- complaint: User has a complaint
- feedback: User wants to give feedback
- goodbye: User is saying goodbye
- other: Other general queries

Respond with:
{
  "intent": "detected_intent",
  "entities": {
    "location": "extracted_location",
    "date": "extracted_date",
    "budget": "extracted_budget",
    "people": "extracted_number_of_people",
    "category": "extracted_category"
  },
  "confidence": 0.95
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing user messages for a tourism chatbot. Extract intents and entities accurately."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Intent detection error:', error);
    return {
      intent: 'other',
      entities: {},
      confidence: 0.5
    };
  }
};

// @desc    Generate response based on intent
const generateResponse = async (params) => {
  const { intent, entities, language, context, user } = params;

  switch (intent) {
    case 'greeting':
      return await handleGreeting(language, context);
    
    case 'destination_info':
      return await handleDestinationInfo(entities, language);
    
    case 'itinerary_planning':
      return await handleItineraryPlanning(entities, language, user);
    
    case 'booking':
      return await handleBooking(entities, language);
    
    case 'weather':
      return await handleWeather(entities, language);
    
    case 'transport':
      return await handleTransport(entities, language);
    
    case 'food':
      return await handleFood(entities, language);
    
    case 'accommodation':
      return await handleAccommodation(entities, language);
    
    case 'events':
      return await handleEvents(entities, language);
    
    case 'emergency':
      return await handleEmergency(language);
    
    case 'complaint':
      return await handleComplaint(language);
    
    case 'feedback':
      return await handleFeedback(language);
    
    case 'goodbye':
      return await handleGoodbye(language);
    
    default:
      return await handleGeneralQuery(params);
  }
};

// @desc    Handle greeting intent
const handleGreeting = async (language, context) => {
  const greetings = {
    en: [
      "Hello! Welcome to Jharkhand Tourism! I'm here to help you plan your perfect trip. How can I assist you today?",
      "Hi there! Ready to explore the beautiful state of Jharkhand? I can help you with destinations, itineraries, bookings, and more!",
      "Welcome! I'm your travel assistant for Jharkhand. What would you like to know about our amazing destinations?"
    ],
    hi: [
      "नमस्ते! झारखंड पर्यटन में आपका स्वागत है! मैं आपकी यात्रा की योजना बनाने में आपकी मदद करने के लिए यहाँ हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?",
      "हैलो! झारखंड के खूबसूरत राज्य का पता लगाने के लिए तैयार हैं? मैं आपकी गंतव्य, यात्रा कार्यक्रम, बुकिंग और बहुत कुछ में मदद कर सकता हूँ!",
      "स्वागत है! मैं झारखंड के लिए आपका यात्रा सहायक हूँ। हमारे अद्भुत गंतव्यों के बारे में आप क्या जानना चाहते हैं?"
    ]
  };

  const messages = greetings[language] || greetings.en;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    message: randomMessage,
    context: { ...context, greeted: true }
  };
};

// @desc    Handle destination information intent
const handleDestinationInfo = async (entities, language) => {
  try {
    const location = entities.location || 'Jharkhand';
    
    const destinations = await Destination.find({
      $or: [
        { name: { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.district': { $regex: location, $options: 'i' } }
      ],
      isActive: true
    }).limit(5);

    if (destinations.length === 0) {
      return {
        message: language === 'hi' 
          ? `क्षमा करें, मुझे "${location}" के बारे में जानकारी नहीं मिली। कृपया कोई अन्य स्थान बताएं।`
          : `Sorry, I couldn't find information about "${location}". Please try another location.`
      };
    }

    let message = language === 'hi' 
      ? `यहाँ "${location}" के लिए कुछ लोकप्रिय गंतव्य हैं:\n\n`
      : `Here are some popular destinations for "${location}":\n\n`;

    destinations.forEach((dest, index) => {
      message += `${index + 1}. **${dest.name}** (${dest.location.city})\n`;
      message += `   ${dest.description}\n`;
      message += `   ⭐ ${dest.rating.average}/5 | ₹${dest.pricing.entryFee.adult} entry\n\n`;
    });

    return {
      message: message,
      attachments: destinations.map(dest => ({
        type: 'destination_card',
        data: {
          id: dest._id,
          name: dest.name,
          location: dest.location,
          image: dest.images[0]?.url,
          rating: dest.rating.average,
          price: dest.pricing.entryFee.adult
        }
      }))
    };
  } catch (error) {
    console.error('Handle destination info error:', error);
    return {
      message: language === 'hi' 
        ? 'क्षमा करें, गंतव्य जानकारी प्राप्त करने में त्रुटि हुई।'
        : 'Sorry, there was an error getting destination information.'
    };
  }
};

// @desc    Handle itinerary planning intent
const handleItineraryPlanning = async (entities, language, user) => {
  const duration = entities.people || '3';
  const budget = entities.budget || '10000';
  const location = entities.location || 'Ranchi';

  const message = language === 'hi'
    ? `मैं आपके लिए ${duration} दिनों की यात्रा की योजना बना सकता हूँ! मैंने देखा कि आपका बजट ₹${budget} है और आप ${location} से शुरू करना चाहते हैं।\n\nकृपया अपनी रुचियां बताएं (जैसे प्रकृति, संस्कृति, रोमांच, आदि) ताकि मैं आपके लिए एक व्यक्तिगत यात्रा कार्यक्रम बना सकूं।`
    : `I can help you plan a ${duration}-day trip! I see your budget is ₹${budget} and you want to start from ${location}.\n\nPlease tell me your interests (like nature, culture, adventure, etc.) so I can create a personalized itinerary for you.`;

  return {
    message: message,
    context: {
      planningTrip: true,
      duration: duration,
      budget: budget,
      location: location
    }
  };
};

// @desc    Handle booking intent
const handleBooking = async (entities, language) => {
  const message = language === 'hi'
    ? 'मैं आपकी बुकिंग में मदद कर सकता हूँ! कृपया बताएं कि आप क्या बुक करना चाहते हैं:\n\n• होटल/होमस्टे\n• टूर पैकेज\n• परिवहन\n• इवेंट्स\n• स्थानीय अनुभव'
    : 'I can help you with bookings! Please tell me what you would like to book:\n\n• Hotels/Homestays\n• Tour Packages\n• Transportation\n• Events\n• Local Experiences';

  return {
    message: message,
    quickReplies: language === 'hi' 
      ? ['होटल', 'टूर', 'परिवहन', 'इवेंट्स']
      : ['Hotels', 'Tours', 'Transport', 'Events']
  };
};

// @desc    Handle weather intent
const handleWeather = async (entities, language) => {
  try {
    const location = entities.location || 'Ranchi';
    const weatherData = await getWeatherData(new Date().toISOString().split('T')[0], 1);
    
    if (weatherData.length > 0) {
      const weather = weatherData[0];
      const message = language === 'hi'
        ? `${location} का आज का मौसम:\n\n🌡️ तापमान: ${weather.temperature}°C\n☁️ स्थिति: ${weather.description}\n💧 आर्द्रता: ${weather.humidity}%\n💨 हवा: ${weather.windSpeed} km/h`
        : `Today's weather in ${location}:\n\n🌡️ Temperature: ${weather.temperature}°C\n☁️ Condition: ${weather.description}\n💧 Humidity: ${weather.humidity}%\n💨 Wind: ${weather.windSpeed} km/h`;

      return { message: message };
    } else {
      return {
        message: language === 'hi'
          ? 'क्षमा करें, मौसम की जानकारी उपलब्ध नहीं है।'
          : 'Sorry, weather information is not available.'
      };
    }
  } catch (error) {
    console.error('Handle weather error:', error);
    return {
      message: language === 'hi'
        ? 'क्षमा करें, मौसम की जानकारी प्राप्त करने में त्रुटि हुई।'
        : 'Sorry, there was an error getting weather information.'
    };
  }
};

// @desc    Handle transport intent
const handleTransport = async (entities, language) => {
  const message = language === 'hi'
    ? 'मैं आपको परिवहन विकल्पों के बारे में जानकारी दे सकता हूँ:\n\n🚗 कार किराया\n🚕 टैक्सी सेवा\n🚌 बस सेवा\n🚂 ट्रेन सेवा\n✈️ हवाई सेवा\n\nकृपया बताएं कि आप कहाँ से कहाँ जाना चाहते हैं?'
    : 'I can provide information about transportation options:\n\n🚗 Car Rental\n🚕 Taxi Service\n🚌 Bus Service\n🚂 Train Service\n✈️ Flight Service\n\nPlease tell me where you want to go from and to?';

  return {
    message: message,
    quickReplies: language === 'hi'
      ? ['कार किराया', 'टैक्सी', 'बस', 'ट्रेन']
      : ['Car Rental', 'Taxi', 'Bus', 'Train']
  };
};

// @desc    Handle food intent
const handleFood = async (entities, language) => {
  const message = language === 'hi'
    ? 'झारखंड में स्वादिष्ट भोजन के विकल्प:\n\n🍽️ स्थानीय व्यंजन\n🍜 स्ट्रीट फूड\n🍴 रेस्टोरेंट\n🏠 होमस्टे भोजन\n🌶️ मसालेदार व्यंजन\n\nकृपया बताएं कि आप किस प्रकार का भोजन पसंद करते हैं?'
    : 'Delicious food options in Jharkhand:\n\n🍽️ Local Cuisine\n🍜 Street Food\n🍴 Restaurants\n🏠 Homestay Meals\n🌶️ Spicy Dishes\n\nPlease tell me what type of food you prefer?';

  return {
    message: message,
    quickReplies: language === 'hi'
      ? ['स्थानीय भोजन', 'स्ट्रीट फूड', 'रेस्टोरेंट', 'मसालेदार']
      : ['Local Food', 'Street Food', 'Restaurants', 'Spicy']
  };
};

// @desc    Handle accommodation intent
const handleAccommodation = async (entities, language) => {
  const message = language === 'hi'
    ? 'झारखंड में रहने के विकल्प:\n\n🏨 होटल\n🏠 होमस्टे\n🏕️ रिसॉर्ट\n⛺ कैम्पिंग\n\nकृपया बताएं कि आप किस प्रकार का आवास पसंद करते हैं और आपका बजट क्या है?'
    : 'Accommodation options in Jharkhand:\n\n🏨 Hotels\n🏠 Homestays\n🏕️ Resorts\n⛺ Camping\n\nPlease tell me what type of accommodation you prefer and what is your budget?';

  return {
    message: message,
    quickReplies: language === 'hi'
      ? ['होटल', 'होमस्टे', 'रिसॉर्ट', 'कैम्पिंग']
      : ['Hotels', 'Homestays', 'Resorts', 'Camping']
  };
};

// @desc    Handle events intent
const handleEvents = async (entities, language) => {
  const message = language === 'hi'
    ? 'झारखंड में आगामी इवेंट्स और त्योहार:\n\n🎉 सरहुल फेस्टिवल\n🎭 सांस्कृतिक कार्यक्रम\n🎪 मेले\n🎨 कला प्रदर्शनी\n🏃‍♂️ एडवेंचर इवेंट्स\n\nकृपया बताएं कि आप किस प्रकार के इवेंट्स में रुचि रखते हैं?'
    : 'Upcoming events and festivals in Jharkhand:\n\n🎉 Sarhul Festival\n🎭 Cultural Programs\n🎪 Fairs\n🎨 Art Exhibitions\n🏃‍♂️ Adventure Events\n\nPlease tell me what type of events you are interested in?';

  return {
    message: message,
    quickReplies: language === 'hi'
      ? ['त्योहार', 'सांस्कृतिक', 'मेले', 'एडवेंचर']
      : ['Festivals', 'Cultural', 'Fairs', 'Adventure']
  };
};

// @desc    Handle emergency intent
const handleEmergency = async (language) => {
  const message = language === 'hi'
    ? '🚨 आपातकालीन सहायता:\n\n🚔 पुलिस: 100\n🚑 एम्बुलेंस: 108\n🔥 फायर ब्रिगेड: 101\n📞 पर्यटन हेल्पलाइन: 1363\n\nकृपया अपनी स्थिति बताएं और मैं आपकी तुरंत मदद करूंगा।'
    : '🚨 Emergency Assistance:\n\n🚔 Police: 100\n🚑 Ambulance: 108\n🔥 Fire Brigade: 101\n📞 Tourist Helpline: 1363\n\nPlease tell me your situation and I will help you immediately.';

  return {
    message: message,
    context: { emergency: true }
  };
};

// @desc    Handle complaint intent
const handleComplaint = async (language) => {
  const message = language === 'hi'
    ? 'मैं आपकी शिकायत सुनने के लिए यहाँ हूँ। कृपया विस्तार से बताएं कि क्या समस्या है और मैं इसे तुरंत संबंधित विभाग को भेजूंगा।'
    : 'I am here to listen to your complaint. Please describe the issue in detail and I will forward it to the concerned department immediately.';

  return {
    message: message,
    context: { complaint: true }
  };
};

// @desc    Handle feedback intent
const handleFeedback = async (language) => {
  const message = language === 'hi'
    ? 'आपका फीडबैक हमारे लिए बहुत महत्वपूर्ण है! कृपया अपने अनुभव के बारे में बताएं और हमें बेहतर बनाने में मदद करें।'
    : 'Your feedback is very important to us! Please share your experience and help us improve.';

  return {
    message: message,
    context: { feedback: true }
  };
};

// @desc    Handle goodbye intent
const handleGoodbye = async (language) => {
  const messages = {
    en: [
      "Thank you for choosing Jharkhand Tourism! Have a wonderful trip and safe travels!",
      "Goodbye! I hope you have an amazing time exploring Jharkhand. Feel free to reach out if you need any help!",
      "Take care and enjoy your journey through the beautiful state of Jharkhand!"
    ],
    hi: [
      "झारखंड पर्यटन चुनने के लिए धन्यवाद! आपकी यात्रा शुभ हो और सुरक्षित रहें!",
      "अलविदा! मुझे उम्मीद है कि आपको झारखंड का पता लगाने में बहुत मजा आएगा। अगर आपको कोई मदद चाहिए तो बेझिझक संपर्क करें!",
      "सावधान रहें और झारखंड के खूबसूरत राज्य की अपनी यात्रा का आनंद लें!"
    ]
  };

  const messageList = messages[language] || messages.en;
  const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];

  return {
    message: randomMessage,
    context: { ...context, sessionEnding: true }
  };
};

// @desc    Handle general queries
const handleGeneralQuery = async (params) => {
  const { message, language } = params;
  
  const prompt = `
You are a knowledgeable tourism assistant for Jharkhand, India. Provide comprehensive and detailed information about Jharkhand's tourism, culture, and heritage.

Question: "${message}"
Language: ${language}

Provide a detailed response covering relevant aspects of Jharkhand including its tourism destinations, cultural heritage, local customs, festivals, cuisine, art forms, and travel tips. Include specific examples and interesting facts where relevant. Organize information in clear sections if the response is lengthy.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful tourism assistant for Jharkhand, India. Provide friendly and informative responses about tourism, destinations, culture, and travel tips."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000  // Increased token limit for more comprehensive responses
    });

    return {
      message: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('General query error:', error);
    return {
      message: language === 'hi'
        ? 'क्षमा करें, मैं आपके प्रश्न का उत्तर नहीं दे सकता। कृपया कोई अन्य प्रश्न पूछें।'
        : 'Sorry, I cannot answer your question. Please ask something else.'
    };
  }
};

// @desc    Generate suggestions based on intent
const generateSuggestions = async (intent, entities, language) => {
  const suggestions = {
    greeting: language === 'hi' 
      ? ['गंतव्य जानकारी', 'यात्रा योजना', 'बुकिंग', 'मौसम']
      : ['Destination Info', 'Plan Trip', 'Make Booking', 'Weather'],
    
    destination_info: language === 'hi'
      ? ['अधिक जानकारी', 'यात्रा योजना', 'बुकिंग', 'निकटवर्ती स्थान']
      : ['More Info', 'Plan Trip', 'Book Now', 'Nearby Places'],
    
    itinerary_planning: language === 'hi'
      ? ['बजट बढ़ाएं', 'अवधि बढ़ाएं', 'रुचियां बताएं', 'बुक करें']
      : ['Increase Budget', 'Extend Duration', 'Tell Interests', 'Book Now'],
    
    booking: language === 'hi'
      ? ['होटल', 'टूर', 'परिवहन', 'इवेंट्स']
      : ['Hotels', 'Tours', 'Transport', 'Events']
  };

  return suggestions[intent] || [];
};

// @desc    Generate quick replies based on intent
const generateQuickReplies = async (intent, language) => {
  const quickReplies = {
    greeting: language === 'hi'
      ? ['नमस्ते', 'मदद चाहिए', 'यात्रा योजना', 'गंतव्य जानकारी']
      : ['Hello', 'Need Help', 'Plan Trip', 'Destination Info'],
    
    destination_info: language === 'hi'
      ? ['और जानकारी', 'यात्रा योजना', 'बुकिंग', 'मौसम']
      : ['More Info', 'Plan Trip', 'Book Now', 'Weather'],
    
    weather: language === 'hi'
      ? ['कल का मौसम', 'सप्ताह भर', 'अन्य स्थान', 'यात्रा सुझाव']
      : ['Tomorrow', 'This Week', 'Other Location', 'Travel Tips']
  };

  return quickReplies[intent] || [];
};
