import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Clock, Plane, Car, Train, Hotel, Camera, Mountain, TreePine, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ItineraryPlannerPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: null,
    endDate: null,
    travelers: 2,
    budget: 'moderate',
    interests: [],
    accommodation: 'hotel',
    transportation: 'car',
    pace: 'moderate',
    specialRequests: ''
  });

  const steps = [
    { number: 1, title: 'Dates & Travelers', icon: Calendar },
    { number: 2, title: 'Budget & Preferences', icon: DollarSign },
    { number: 3, title: 'Interests & Activities', icon: Camera },
    { number: 4, title: 'Travel Details', icon: Plane }
  ];

  const budgetOptions = [
    { id: 'budget', name: 'Budget', range: '₹5,000 - ₹15,000', icon: '💰' },
    { id: 'moderate', name: 'Moderate', range: '₹15,000 - ₹35,000', icon: '💳' },
    { id: 'luxury', name: 'Luxury', range: '₹35,000+', icon: '💎' }
  ];

  const interestOptions = [
    { id: 'nature', name: 'Nature & Wildlife', icon: TreePine, color: 'bg-green-500' },
    { id: 'culture', name: 'Culture & Heritage', icon: Building, color: 'bg-purple-500' },
    { id: 'adventure', name: 'Adventure Sports', icon: Mountain, color: 'bg-red-500' },
    { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-blue-500' },
    { id: 'spiritual', name: 'Spiritual Sites', icon: Building, color: 'bg-orange-500' },
    { id: 'waterfalls', name: 'Waterfalls', icon: TreePine, color: 'bg-cyan-500' }
  ];

  const accommodationOptions = [
    { id: 'hotel', name: 'Hotels', icon: Hotel },
    { id: 'resort', name: 'Resorts', icon: Building },
    { id: 'homestay', name: 'Homestays', icon: Users },
    { id: 'camping', name: 'Camping', icon: TreePine }
  ];

  const transportationOptions = [
    { id: 'car', name: 'Private Car', icon: Car },
    { id: 'bus', name: 'Bus', icon: Car },
    { id: 'train', name: 'Train', icon: Train },
    { id: 'flight', name: 'Flight', icon: Plane }
  ];

  const paceOptions = [
    { id: 'relaxed', name: 'Relaxed', description: 'Take it slow, enjoy each moment' },
    { id: 'moderate', name: 'Moderate', description: 'Balanced mix of activities and rest' },
    { id: 'packed', name: 'Packed', description: 'See as much as possible' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Navigate to results page with form data
    navigate('/itinerary/result', { state: { formData } });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.startDate && formData.endDate && formData.travelers > 0;
      case 2:
        return formData.budget;
      case 3:
        return formData.interests.length > 0;
      case 4:
        return formData.accommodation && formData.transportation;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Plan Your Perfect Trip
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Tell us your preferences and we'll create a personalized itinerary for your Jharkhand adventure
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Step {step.number}
                    </p>
                    <p className={`text-sm ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Dates & Travelers */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">When are you traveling?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    minDate={new Date()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholderText="Select start date"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    minDate={formData.startDate || new Date()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholderText="Select end date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleInputChange('travelers', Math.max(1, formData.travelers - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-8 text-center">{formData.travelers}</span>
                  <button
                    onClick={() => handleInputChange('travelers', formData.travelers + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Budget & Preferences */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">What's your budget?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {budgetOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleInputChange('budget', option.id)}
                    className={`p-6 border-2 rounded-xl text-center transition-all ${
                      formData.budget === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <h3 className="font-semibold mb-1">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.range}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Pace
                </label>
                <div className="space-y-3">
                  {paceOptions.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="radio"
                        name="pace"
                        value={option.id}
                        checked={formData.pace === option.id}
                        onChange={(e) => handleInputChange('pace', e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Interests & Activities */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">What interests you most?</h2>
              <p className="text-gray-600 mb-6">Select all that apply to personalize your itinerary</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {interestOptions.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = formData.interests.includes(interest.id);
                  
                  return (
                    <button
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${interest.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-medium text-sm">{interest.name}</h3>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: Travel Details */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">Travel preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Accommodation
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {accommodationOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleInputChange('accommodation', option.id)}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.accommodation === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{option.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Transportation
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {transportationOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleInputChange('transportation', option.id)}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.transportation === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{option.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests or Notes
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any dietary restrictions, accessibility needs, or special occasions?"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isStepValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isStepValid()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Itinerary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlannerPage;
