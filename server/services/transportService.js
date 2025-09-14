const axios = require('axios');

// @desc    Get transport options for itinerary
exports.getTransportOptions = async (itinerary) => {
  try {
    const transportOptions = [];
    const { days, startLocation, endLocation } = itinerary;
    
    // Get transport between major locations
    const locations = extractLocationsFromItinerary(days, startLocation, endLocation);
    
    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      
      const options = await getTransportBetweenLocations(from, to);
      transportOptions.push({
        from: from.name,
        to: to.name,
        options: options
      });
    }
    
    return transportOptions;
  } catch (error) {
    console.error('Transport service error:', error);
    return [];
  }
};

// @desc    Get transport options between two locations
const getTransportBetweenLocations = async (from, to) => {
  try {
    const options = [];
    
    // Calculate distance and estimated travel time
    const distance = calculateDistance(from.coordinates, to.coordinates);
    const travelTime = estimateTravelTime(distance);
    
    // Car rental option
    options.push({
      mode: 'car',
      provider: 'Local Car Rental',
      cost: Math.round(distance * 8), // ₹8 per km
      duration: travelTime,
      description: 'Self-drive car rental',
      bookingInfo: 'Contact local car rental agencies',
      advantages: ['Flexibility', 'Privacy', 'Multiple stops'],
      disadvantages: ['Driving responsibility', 'Fuel costs', 'Parking']
    });
    
    // Taxi option
    options.push({
      mode: 'taxi',
      provider: 'Local Taxi Service',
      cost: Math.round(distance * 12), // ₹12 per km
      duration: travelTime,
      description: 'Private taxi with driver',
      bookingInfo: 'Book through local taxi services',
      advantages: ['No driving required', 'Local knowledge', 'Comfortable'],
      disadvantages: ['Higher cost', 'Less flexibility']
    });
    
    // Bus option (if available)
    if (distance > 50) { // Only for longer distances
      options.push({
        mode: 'bus',
        provider: 'State Transport',
        cost: Math.round(distance * 2), // ₹2 per km
        duration: travelTime * 1.5, // Buses are slower
        description: 'Public bus service',
        bookingInfo: 'Book at bus station or online',
        advantages: ['Economical', 'Regular service'],
        disadvantages: ['Fixed schedule', 'Less comfort', 'Multiple stops']
      });
    }
    
    // Train option (if available and distance > 100km)
    if (distance > 100) {
      const trainOptions = await getTrainOptions(from, to);
      options.push(...trainOptions);
    }
    
    return options;
  } catch (error) {
    console.error('Error getting transport options:', error);
    return [];
  }
};

// @desc    Get train options between locations
const getTrainOptions = async (from, to) => {
  try {
    // This would integrate with Indian Railways API
    // For now, return mock data
    return [
      {
        mode: 'train',
        provider: 'Indian Railways',
        cost: 500,
        duration: '4 hours',
        description: 'Express train service',
        bookingInfo: 'Book at railway station or IRCTC website',
        advantages: ['Comfortable', 'Scenic route', 'Economical'],
        disadvantages: ['Fixed schedule', 'Limited flexibility']
      }
    ];
  } catch (error) {
    console.error('Train options error:', error);
    return [];
  }
};

// @desc    Extract unique locations from itinerary
const extractLocationsFromItinerary = (days, startLocation, endLocation) => {
  const locations = [startLocation];
  const locationMap = new Map();
  
  days.forEach(day => {
    day.activities.forEach(activity => {
      if (activity.location && activity.location.name) {
        const key = `${activity.location.coordinates.lat},${activity.location.coordinates.lng}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, activity.location);
        }
      }
    });
  });
  
  // Add unique locations
  locationMap.forEach(location => {
    locations.push(location);
  });
  
  // Add end location if different from start
  if (endLocation && endLocation.name !== startLocation.name) {
    locations.push(endLocation);
  }
  
  return locations;
};

// @desc    Calculate distance between two coordinates
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// @desc    Estimate travel time based on distance and mode
const estimateTravelTime = (distance) => {
  if (distance < 10) return '15-30 minutes';
  if (distance < 50) return '1-2 hours';
  if (distance < 100) return '2-3 hours';
  if (distance < 200) return '3-4 hours';
  return '4+ hours';
};

// @desc    Get local transport options within a city
exports.getLocalTransportOptions = async (city) => {
  try {
    const options = [
      {
        mode: 'auto_rickshaw',
        provider: 'Local Auto Rickshaws',
        cost: '₹10-15 per km',
        description: 'Three-wheeler auto rickshaws',
        advantages: ['Short distances', 'Easy availability', 'Affordable'],
        disadvantages: ['Limited space', 'No AC', 'Negotiation required']
      },
      {
        mode: 'cycle_rickshaw',
        provider: 'Cycle Rickshaws',
        cost: '₹5-10 per km',
        description: 'Manual cycle rickshaws',
        advantages: ['Very economical', 'Eco-friendly', 'Short distances'],
        disadvantages: ['Slow', 'Limited to short distances', 'Physical effort']
      },
      {
        mode: 'city_bus',
        provider: 'City Bus Service',
        cost: '₹5-20 per trip',
        description: 'Public city bus service',
        advantages: ['Very economical', 'Regular service', 'Covers most areas'],
        disadvantages: ['Crowded', 'Fixed routes', 'Less comfortable']
      },
      {
        mode: 'walking',
        provider: 'Self',
        cost: 'Free',
        description: 'Walking for short distances',
        advantages: ['Free', 'Exercise', 'Explore at own pace'],
        disadvantages: ['Limited distance', 'Weather dependent', 'Time consuming']
      }
    ];
    
    return options;
  } catch (error) {
    console.error('Local transport options error:', error);
    return [];
  }
};

// @desc    Get transport schedule for a specific route
exports.getTransportSchedule = async (from, to, date) => {
  try {
    // This would integrate with actual transport APIs
    // For now, return mock schedule data
    const schedule = [
      {
        mode: 'bus',
        provider: 'State Transport',
        departure: '06:00',
        arrival: '10:00',
        duration: '4 hours',
        cost: 200,
        availability: 'Available'
      },
      {
        mode: 'bus',
        provider: 'Private Operator',
        departure: '08:00',
        arrival: '12:00',
        duration: '4 hours',
        cost: 300,
        availability: 'Available'
      },
      {
        mode: 'train',
        provider: 'Indian Railways',
        departure: '14:00',
        arrival: '18:00',
        duration: '4 hours',
        cost: 500,
        availability: 'Limited'
      }
    ];
    
    return schedule;
  } catch (error) {
    console.error('Transport schedule error:', error);
    return [];
  }
};

// @desc    Book transport
exports.bookTransport = async (bookingData) => {
  try {
    const { mode, provider, from, to, date, passengers, contact } = bookingData;
    
    // This would integrate with actual booking systems
    const booking = {
      id: Math.random().toString(36).substring(2, 15),
      mode,
      provider,
      from,
      to,
      date,
      passengers,
      contact,
      status: 'confirmed',
      bookingTime: new Date(),
      totalCost: bookingData.cost * passengers
    };
    
    return booking;
  } catch (error) {
    console.error('Transport booking error:', error);
    throw new Error('Failed to book transport');
  }
};
