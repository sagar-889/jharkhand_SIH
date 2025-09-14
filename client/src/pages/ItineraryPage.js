import React, { useState } from 'react';

const ItineraryPage = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    duration: 3,
    budget: '',
    travelers: 1,
    interests: [],
    accommodation: 'hotel'
  });

  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const interestOptions = [
    'Nature & Wildlife',
    'Cultural Heritage',
    'Adventure Sports',
    'Photography',
    'Spiritual Sites',
    'Local Cuisine',
    'Handicrafts',
    'Trekking'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        interests: checked 
          ? [...prev.interests, value]
          : prev.interests.filter(interest => interest !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value
      }));
    }
  };

  const generateItinerary = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockItinerary = {
        title: `${formData.duration}-Day Jharkhand Adventure`,
        totalCost: formData.budget || (formData.duration * 2500),
        days: Array.from({ length: formData.duration }, (_, index) => ({
          day: index + 1,
          date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString(),
          activities: [
            {
              time: '09:00 AM',
              activity: 'Morning Nature Walk',
              location: 'Netarhat Hills',
              duration: '2 hours',
              cost: '₹500'
            },
            {
              time: '12:00 PM',
              activity: 'Local Cuisine Experience',
              location: 'Tribal Village',
              duration: '1.5 hours',
              cost: '₹800'
            },
            {
              time: '03:00 PM',
              activity: 'Cultural Site Visit',
              location: 'Historical Temple',
              duration: '2 hours',
              cost: '₹300'
            }
          ]
        }))
      };
      
      setItinerary(mockItinerary);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Itinerary Planner</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Let our AI create a personalized itinerary based on your preferences, 
            budget, and interests for the perfect Jharkhand experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Trip Details</h2>
            
            <form className="space-y-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Duration (days)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>1 Week</option>
                  <option value={10}>10 Days</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="Enter your budget"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Number of Travelers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers
                </label>
                <input
                  type="number"
                  name="travelers"
                  value={formData.travelers}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interests (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map(interest => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        name="interests"
                        value={interest}
                        checked={formData.interests.includes(interest)}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accommodation Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Preference
                </label>
                <select
                  name="accommodation"
                  value={formData.accommodation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="hotel">Hotel</option>
                  <option value="homestay">Homestay</option>
                  <option value="resort">Resort</option>
                  <option value="camping">Camping</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={generateItinerary}
                disabled={isGenerating || !formData.startDate}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating Itinerary...' : 'Generate My Itinerary'}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Your Itinerary</h2>
            
            {!itinerary ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Plan Your Trip?</h3>
                <p className="text-gray-600">
                  Fill in your trip details and click "Generate My Itinerary" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">
                    {itinerary.title}
                  </h3>
                  <p className="text-primary-700">
                    Estimated Cost: ₹{itinerary.totalCost.toLocaleString()}
                  </p>
                </div>

                {itinerary.days.map((day, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Day {day.day} - {day.date}
                    </h4>
                    <div className="space-y-3">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{activity.activity}</div>
                            <div className="text-sm text-gray-600">📍 {activity.location}</div>
                            <div className="text-sm text-gray-500">
                              {activity.time} • {activity.duration}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-primary-600">
                            {activity.cost}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                    Save Itinerary
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Planning Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🌡️</div>
              <h3 className="font-semibold mb-2">Best Time to Visit</h3>
              <p className="text-sm text-gray-600">October to March for pleasant weather</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎒</div>
              <h3 className="font-semibold mb-2">What to Pack</h3>
              <p className="text-sm text-gray-600">Comfortable shoes, light clothing, camera</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-semibold mb-2">Pro Tip</h3>
              <p className="text-sm text-gray-600">Book homestays in advance for authentic experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPage;
