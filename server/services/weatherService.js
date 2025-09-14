const axios = require('axios');

// @desc    Get weather data for itinerary dates
exports.getWeatherData = async (startDate, duration) => {
  try {
    const weatherData = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = currentDate.toISOString().split('T')[0];
      
      try {
        // Using OpenWeatherMap API (you can replace with any weather service)
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=Ranchi,IN&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        
        const forecast = response.data.list.find(item => 
          item.dt_txt.startsWith(dateString)
        );
        
        if (forecast) {
          weatherData.push({
            date: currentDate,
            condition: forecast.weather[0].main.toLowerCase(),
            temperature: Math.round(forecast.main.temp),
            humidity: forecast.main.humidity,
            description: forecast.weather[0].description,
            windSpeed: forecast.wind.speed,
            precipitation: forecast.rain ? forecast.rain['3h'] || 0 : 0
          });
        } else {
          // Fallback data if no forecast available
          weatherData.push({
            date: currentDate,
            condition: 'sunny',
            temperature: 25,
            humidity: 60,
            description: 'Clear sky',
            windSpeed: 5,
            precipitation: 0
          });
        }
      } catch (weatherError) {
        console.error('Weather API error:', weatherError);
        // Fallback data
        weatherData.push({
          date: currentDate,
          condition: 'sunny',
          temperature: 25,
          humidity: 60,
          description: 'Clear sky',
          windSpeed: 5,
          precipitation: 0
        });
      }
    }
    
    return weatherData;
  } catch (error) {
    console.error('Weather service error:', error);
    // Return fallback weather data
    return generateFallbackWeatherData(startDate, duration);
  }
};

// @desc    Get current weather for a location
exports.getCurrentWeather = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    
    return {
      condition: response.data.weather[0].main.toLowerCase(),
      temperature: Math.round(response.data.main.temp),
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      windSpeed: response.data.wind.speed,
      visibility: response.data.visibility / 1000, // Convert to km
      uvIndex: response.data.uvi || 0
    };
  } catch (error) {
    console.error('Current weather error:', error);
    return {
      condition: 'sunny',
      temperature: 25,
      humidity: 60,
      description: 'Clear sky',
      windSpeed: 5,
      visibility: 10,
      uvIndex: 5
    };
  }
};

// @desc    Get weather alerts for a region
exports.getWeatherAlerts = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}&exclude=minutely,hourly,daily`
    );
    
    const alerts = response.data.alerts || [];
    
    return alerts.map(alert => ({
      title: alert.event,
      description: alert.description,
      severity: alert.tags[0] || 'moderate',
      start: new Date(alert.start * 1000),
      end: new Date(alert.end * 1000)
    }));
  } catch (error) {
    console.error('Weather alerts error:', error);
    return [];
  }
};

// @desc    Generate fallback weather data
const generateFallbackWeatherData = (startDate, duration) => {
  const weatherData = [];
  const start = new Date(startDate);
  
  // Jharkhand typical weather patterns
  const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'light_rain'];
  const temperatures = [22, 25, 28, 30, 32];
  
  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temperature = temperatures[Math.floor(Math.random() * temperatures.length)];
    
    weatherData.push({
      date: currentDate,
      condition: condition,
      temperature: temperature,
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      description: getWeatherDescription(condition),
      windSpeed: Math.floor(Math.random() * 10) + 3, // 3-13 km/h
      precipitation: condition === 'light_rain' ? Math.floor(Math.random() * 5) : 0
    });
  }
  
  return weatherData;
};

// @desc    Get weather description based on condition
const getWeatherDescription = (condition) => {
  const descriptions = {
    'sunny': 'Clear sky with bright sunshine',
    'partly_cloudy': 'Partly cloudy with some sunshine',
    'cloudy': 'Overcast with clouds covering the sky',
    'light_rain': 'Light rain showers expected',
    'heavy_rain': 'Heavy rainfall with thunderstorms possible',
    'fog': 'Foggy conditions with reduced visibility',
    'storm': 'Thunderstorms with heavy rain and strong winds'
  };
  
  return descriptions[condition] || 'Weather conditions vary';
};

// @desc    Get weather recommendations for activities
exports.getWeatherRecommendations = (weatherData) => {
  const recommendations = [];
  
  weatherData.forEach(day => {
    const dayRecommendations = [];
    
    if (day.condition === 'sunny') {
      dayRecommendations.push('Perfect weather for outdoor activities and photography');
      dayRecommendations.push('Carry sunscreen and stay hydrated');
    } else if (day.condition === 'light_rain') {
      dayRecommendations.push('Carry an umbrella or raincoat');
      dayRecommendations.push('Indoor activities recommended for afternoon');
    } else if (day.condition === 'heavy_rain') {
      dayRecommendations.push('Avoid outdoor activities due to heavy rain');
      dayRecommendations.push('Consider indoor cultural sites and museums');
    } else if (day.condition === 'fog') {
      dayRecommendations.push('Drive carefully due to reduced visibility');
      dayRecommendations.push('Morning activities may be affected by fog');
    }
    
    if (day.temperature > 30) {
      dayRecommendations.push('Hot weather - carry water and wear light clothing');
    } else if (day.temperature < 20) {
      dayRecommendations.push('Cool weather - carry a light jacket');
    }
    
    if (day.humidity > 80) {
      dayRecommendations.push('High humidity - take breaks and stay cool');
    }
    
    recommendations.push({
      date: day.date,
      recommendations: dayRecommendations
    });
  });
  
  return recommendations;
};
