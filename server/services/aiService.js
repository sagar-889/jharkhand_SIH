const OpenAI = require('openai');
const Destination = require('../models/Destination');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Generate AI-powered itinerary
exports.generateItinerary = async (params) => {
  try {
    const {
      startDate,
      duration,
      budget,
      travelers,
      interests,
      accommodation,
      startLocation,
      endLocation,
      specialRequirements,
      weatherData,
      userPreferences
    } = params;

    // Get relevant destinations from database
    const destinations = await Destination.find({
      isActive: true,
      category: { $in: interests }
    }).limit(20);

    // Prepare context for AI
    const context = {
      destinations: destinations.map(dest => ({
        name: dest.name,
        location: dest.location,
        category: dest.category,
        description: dest.description,
        pricing: dest.pricing,
        facilities: dest.facilities,
        rating: dest.rating,
        visitDuration: dest.visitDuration
      })),
      weather: weatherData,
      userPreferences,
      specialRequirements
    };

    // Create AI prompt
    const prompt = createItineraryPrompt({
      startDate,
      duration,
      budget,
      travelers,
      interests,
      accommodation,
      startLocation,
      endLocation,
      context
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner specializing in Jharkhand tourism. Create detailed, practical itineraries that consider local culture, weather, and budget constraints."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse AI response and structure itinerary
    const itinerary = parseAIResponse(aiResponse, {
      startDate,
      duration,
      budget,
      travelers,
      interests,
      accommodation,
      startLocation,
      endLocation
    });

    return itinerary;
  } catch (error) {
    console.error('AI service error:', error);
    throw new Error('Failed to generate AI itinerary');
  }
};

// @desc    Create itinerary prompt for AI
const createItineraryPrompt = (params) => {
  const {
    startDate,
    duration,
    budget,
    travelers,
    interests,
    accommodation,
    startLocation,
    endLocation,
    context
  } = params;

  return `
Create a detailed ${duration}-day itinerary for Jharkhand tourism with the following requirements:

**Trip Details:**
- Start Date: ${startDate}
- Duration: ${duration} days
- Budget: ₹${budget} for ${travelers} travelers
- Start Location: ${startLocation}
- End Location: ${endLocation || 'Same as start'}
- Accommodation: ${accommodation}
- Interests: ${interests.join(', ')}

**Available Destinations:**
${context.destinations.map(dest => 
  `- ${dest.name} (${dest.category}): ${dest.description}
   Location: ${dest.location.city}, ${dest.location.district}
   Entry Fee: ₹${dest.pricing.entryFee.adult}
   Rating: ${dest.rating.average}/5
   Visit Duration: ${dest.visitDuration?.min || 2}-${dest.visitDuration?.max || 4} hours`
).join('\n')}

**Weather Forecast:**
${context.weather ? context.weather.map(day => 
  `- ${day.date}: ${day.condition}, ${day.temperature}°C`
).join('\n') : 'Weather data not available'}

**Special Requirements:**
${context.specialRequirements?.join(', ') || 'None'}

**Instructions:**
1. Create a day-by-day itinerary with specific times and activities
2. Include realistic travel times between locations
3. Consider weather conditions for outdoor activities
4. Balance the budget across accommodation, food, transport, and activities
5. Include local cultural experiences and authentic food recommendations
6. Suggest appropriate accommodation options
7. Include emergency contacts and important information
8. Consider accessibility and safety factors
9. Include both popular attractions and hidden gems
10. Provide alternative activities for bad weather

**Output Format:**
Return a JSON object with the following structure:
{
  "title": "Itinerary title",
  "description": "Brief description",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "weather": {
        "condition": "sunny/rainy/cloudy",
        "temperature": 25,
        "humidity": 60
      },
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "location": {
            "name": "Location name",
            "coordinates": {"lat": 23.3441, "lng": 85.3096},
            "address": "Full address"
          },
          "duration": "2 hours",
          "cost": 500,
          "description": "Activity description",
          "category": "sightseeing/adventure/cultural/food/shopping/relaxation/transport",
          "bookingRequired": true/false,
          "bookingInfo": {
            "provider": "Provider name",
            "contact": "Contact info",
            "website": "Website URL",
            "price": 500
          },
          "weatherDependent": true/false,
          "alternatives": [
            {
              "activity": "Alternative activity",
              "location": "Alternative location",
              "cost": 300
            }
          ]
        }
      ],
      "totalCost": 1500,
      "notes": "Day notes"
    }
  ],
  "budget": {
    "total": 15000,
    "perDay": 5000,
    "breakdown": {
      "accommodation": 6000,
      "food": 4000,
      "transport": 3000,
      "activities": 1500,
      "miscellaneous": 500
    }
  },
  "accommodation": {
    "recommendations": [
      {
        "name": "Hotel name",
        "type": "hotel/homestay/resort",
        "location": "Location",
        "price": 2000,
        "rating": 4.5,
        "amenities": ["WiFi", "AC", "Restaurant"],
        "bookingInfo": "Booking details"
      }
    ]
  },
  "transport": {
    "mode": "car/bus/train/mixed",
    "options": [
      {
        "mode": "car",
        "cost": 2000,
        "duration": "3 hours",
        "provider": "Car rental company",
        "bookingInfo": "Booking details"
      }
    ]
  },
  "localContacts": [
    {
      "name": "Contact name",
      "role": "Guide/Driver/Hotel Manager",
      "contact": "Phone number",
      "location": "Location"
    }
  ],
  "emergencyContacts": [
    {
      "name": "Police",
      "number": "100",
      "type": "Emergency"
    }
  ],
  "documents": [
    {
      "name": "ID Proof",
      "type": "Aadhar Card/Passport",
      "required": true,
      "status": "pending"
    }
  ],
  "tags": ["adventure", "cultural", "nature"],
  "weatherRecommendations": [
    "Carry rain gear for afternoon showers",
    "Best time for photography is early morning"
  ]
}

Make sure the response is valid JSON and follows the exact structure provided.
  `;
};

// @desc    Parse AI response and structure itinerary
const parseAIResponse = (aiResponse, params) => {
  try {
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const itineraryData = JSON.parse(jsonMatch[0]);
    
    // Validate and structure the data
    const structuredItinerary = {
      title: itineraryData.title || `${params.duration}-Day Jharkhand Adventure`,
      description: itineraryData.description || 'AI-generated itinerary for Jharkhand tourism',
      startDate: new Date(params.startDate),
      endDate: new Date(new Date(params.startDate).getTime() + (params.duration - 1) * 24 * 60 * 60 * 1000),
      duration: params.duration,
      budget: {
        total: itineraryData.budget?.total || params.budget,
        perDay: itineraryData.budget?.perDay || Math.round(params.budget / params.duration),
        breakdown: itineraryData.budget?.breakdown || {
          accommodation: Math.round(params.budget * 0.4),
          food: Math.round(params.budget * 0.3),
          transport: Math.round(params.budget * 0.2),
          activities: Math.round(params.budget * 0.1),
          miscellaneous: 0
        }
      },
      travelers: {
        count: params.travelers,
        adults: params.travelers,
        children: 0,
        seniors: 0
      },
      interests: params.interests,
      accommodation: {
        type: params.accommodation,
        recommendations: itineraryData.accommodation?.recommendations || []
      },
      startLocation: {
        name: params.startLocation,
        coordinates: { lat: 23.3441, lng: 85.3096 } // Default to Ranchi
      },
      endLocation: {
        name: params.endLocation || params.startLocation,
        coordinates: { lat: 23.3441, lng: 85.3096 }
      },
      days: itineraryData.days || [],
      totalCost: itineraryData.budget?.total || params.budget,
      status: 'draft',
      specialRequirements: params.specialRequirements || [],
      weatherData: {
        forecast: [],
        recommendations: itineraryData.weatherRecommendations || []
      },
      transport: itineraryData.transport || {
        mode: 'mixed',
        options: []
      },
      localContacts: itineraryData.localContacts || [],
      emergencyContacts: itineraryData.emergencyContacts || [
        {
          name: 'Police',
          number: '100',
          type: 'Emergency'
        },
        {
          name: 'Tourist Helpline',
          number: '1363',
          type: 'Tourism'
        }
      ],
      documents: itineraryData.documents || [
        {
          name: 'ID Proof',
          type: 'Aadhar Card/Passport',
          required: true,
          status: 'pending'
        }
      ],
      tags: itineraryData.tags || params.interests,
      isPublic: false
    };

    return structuredItinerary;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return a basic itinerary if parsing fails
    return createFallbackItinerary(params);
  }
};

// @desc    Create fallback itinerary if AI fails
const createFallbackItinerary = (params) => {
  const days = [];
  const startDate = new Date(params.startDate);
  
  for (let i = 0; i < params.duration; i++) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    
    days.push({
      day: i + 1,
      date: currentDate,
      weather: {
        condition: 'sunny',
        temperature: 25,
        humidity: 60
      },
      activities: [
        {
          time: '09:00 AM',
          activity: 'Morning Sightseeing',
          location: {
            name: 'Popular Destination',
            coordinates: { lat: 23.3441, lng: 85.3096 },
            address: 'Jharkhand, India'
          },
          duration: '3 hours',
          cost: Math.round(params.budget / params.duration / 2),
          description: 'Explore local attractions',
          category: 'sightseeing',
          bookingRequired: false,
          weatherDependent: false,
          alternatives: []
        },
        {
          time: '02:00 PM',
          activity: 'Local Cuisine Experience',
          location: {
            name: 'Local Restaurant',
            coordinates: { lat: 23.3441, lng: 85.3096 },
            address: 'Jharkhand, India'
          },
          duration: '1 hour',
          cost: Math.round(params.budget / params.duration / 4),
          description: 'Taste authentic local food',
          category: 'food',
          bookingRequired: false,
          weatherDependent: false,
          alternatives: []
        }
      ],
      totalCost: Math.round(params.budget / params.duration),
      notes: `Day ${i + 1} of your Jharkhand adventure`
    });
  }

  return {
    title: `${params.duration}-Day Jharkhand Adventure`,
    description: 'A wonderful journey through Jharkhand',
    startDate: startDate,
    endDate: new Date(startDate.getTime() + (params.duration - 1) * 24 * 60 * 60 * 1000),
    duration: params.duration,
    budget: {
      total: params.budget,
      perDay: Math.round(params.budget / params.duration),
      breakdown: {
        accommodation: Math.round(params.budget * 0.4),
        food: Math.round(params.budget * 0.3),
        transport: Math.round(params.budget * 0.2),
        activities: Math.round(params.budget * 0.1),
        miscellaneous: 0
      }
    },
    travelers: {
      count: params.travelers,
      adults: params.travelers,
      children: 0,
      seniors: 0
    },
    interests: params.interests,
    accommodation: {
      type: params.accommodation,
      recommendations: []
    },
    startLocation: {
      name: params.startLocation,
      coordinates: { lat: 23.3441, lng: 85.3096 }
    },
    endLocation: {
      name: params.endLocation || params.startLocation,
      coordinates: { lat: 23.3441, lng: 85.3096 }
    },
    days: days,
    totalCost: params.budget,
    status: 'draft',
    specialRequirements: params.specialRequirements || [],
    weatherData: {
      forecast: [],
      recommendations: []
    },
    transport: {
      mode: 'mixed',
      options: []
    },
    localContacts: [],
    emergencyContacts: [
      {
        name: 'Police',
        number: '100',
        type: 'Emergency'
      }
    ],
    documents: [
      {
        name: 'ID Proof',
        type: 'Aadhar Card/Passport',
        required: true,
        status: 'pending'
      }
    ],
    tags: params.interests,
    isPublic: false
  };
};
