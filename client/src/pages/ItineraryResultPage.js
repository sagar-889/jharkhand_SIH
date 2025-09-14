import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, DollarSign, Download, Share2, Edit, Star, Camera, Car, Hotel } from 'lucide-react';
import { motion } from 'framer-motion';

const ItineraryResultPage = () => {
  const location = useLocation();
  const { formData } = location.state || {};
  const [activeDay, setActiveDay] = useState(1);

  // Generate itinerary based on form data
  const generateItinerary = () => {
    const days = Math.ceil((new Date(formData?.endDate) - new Date(formData?.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    const sampleItinerary = {
      1: {
        title: "Arrival & Ranchi Exploration",
        activities: [
          {
            time: "09:00 AM",
            title: "Arrival in Ranchi",
            description: "Check into hotel and freshen up",
            location: "Ranchi",
            duration: "1 hour",
            type: "transport",
            cost: "₹0"
          },
          {
            time: "11:00 AM",
            title: "Hundru Falls Visit",
            description: "Experience the magnificent 98m waterfall with photography opportunities",
            location: "Hundru Falls",
            duration: "4 hours",
            type: "sightseeing",
            cost: "₹500"
          },
          {
            time: "04:00 PM",
            title: "Ranchi Lake",
            description: "Peaceful boat ride and evening relaxation",
            location: "Ranchi Lake",
            duration: "2 hours",
            type: "leisure",
            cost: "₹300"
          },
          {
            time: "07:00 PM",
            title: "Local Cuisine Dinner",
            description: "Try authentic Jharkhandi dishes at a local restaurant",
            location: "Ranchi City",
            duration: "1.5 hours",
            type: "dining",
            cost: "₹800"
          }
        ]
      },
      2: {
        title: "Netarhat Hill Station",
        activities: [
          {
            time: "06:00 AM",
            title: "Travel to Netarhat",
            description: "Scenic drive to the Queen of Chotanagpur",
            location: "Netarhat",
            duration: "3 hours",
            type: "transport",
            cost: "₹1,200"
          },
          {
            time: "10:00 AM",
            title: "Sunrise Point",
            description: "Visit the famous sunrise viewpoint and enjoy panoramic views",
            location: "Netarhat",
            duration: "2 hours",
            type: "sightseeing",
            cost: "₹200"
          },
          {
            time: "01:00 PM",
            title: "Local Lunch",
            description: "Traditional meal with hill station specialties",
            location: "Netarhat",
            duration: "1 hour",
            type: "dining",
            cost: "₹600"
          },
          {
            time: "03:00 PM",
            title: "Nature Walk & Photography",
            description: "Explore the scenic trails and capture beautiful landscapes",
            location: "Netarhat",
            duration: "3 hours",
            type: "activity",
            cost: "₹300"
          },
          {
            time: "07:00 PM",
            title: "Sunset Viewing",
            description: "Watch the spectacular sunset from Magnolia Point",
            location: "Netarhat",
            duration: "1 hour",
            type: "sightseeing",
            cost: "₹0"
          }
        ]
      },
      3: {
        title: "Betla National Park Safari",
        activities: [
          {
            time: "05:00 AM",
            title: "Travel to Betla",
            description: "Early morning departure for wildlife sanctuary",
            location: "Betla National Park",
            duration: "2.5 hours",
            type: "transport",
            cost: "₹1,000"
          },
          {
            time: "08:00 AM",
            title: "Morning Safari",
            description: "Tiger and elephant spotting in their natural habitat",
            location: "Betla National Park",
            duration: "3 hours",
            type: "wildlife",
            cost: "₹1,500"
          },
          {
            time: "12:00 PM",
            title: "Lunch at Forest Rest House",
            description: "Meal surrounded by nature",
            location: "Betla",
            duration: "1 hour",
            type: "dining",
            cost: "₹500"
          },
          {
            time: "02:00 PM",
            title: "Nature Trail & Bird Watching",
            description: "Guided walk through the forest with bird identification",
            location: "Betla National Park",
            duration: "2.5 hours",
            type: "activity",
            cost: "₹400"
          },
          {
            time: "06:00 PM",
            title: "Return Journey",
            description: "Drive back to base location",
            location: "Return",
            duration: "2.5 hours",
            type: "transport",
            cost: "₹1,000"
          }
        ]
      }
    };

    return { days, itinerary: sampleItinerary };
  };

  const { days, itinerary } = generateItinerary();

  const getActivityIcon = (type) => {
    switch (type) {
      case 'transport': return Car;
      case 'sightseeing': return Camera;
      case 'wildlife': return Users;
      case 'dining': return Hotel;
      case 'activity': return MapPin;
      case 'leisure': return Clock;
      default: return MapPin;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'transport': return 'bg-blue-100 text-blue-600';
      case 'sightseeing': return 'bg-green-100 text-green-600';
      case 'wildlife': return 'bg-orange-100 text-orange-600';
      case 'dining': return 'bg-purple-100 text-purple-600';
      case 'activity': return 'bg-red-100 text-red-600';
      case 'leisure': return 'bg-cyan-100 text-cyan-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const totalCost = Object.values(itinerary).reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + parseInt(activity.cost.replace('₹', '').replace(',', '')) || 0;
    }, 0);
  }, 0);

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No itinerary data found</h2>
          <Link to="/itinerary" className="text-blue-600 hover:text-blue-700">
            Go back to planner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Jharkhand Itinerary
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              A personalized {days}-day journey crafted just for you
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{days}</div>
                <div className="text-sm opacity-80">Days</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formData.travelers}</div>
                <div className="text-sm opacity-80">Travelers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <DollarSign className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">₹{totalCost.toLocaleString()}</div>
                <div className="text-sm opacity-80">Total Cost</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{Object.values(itinerary).reduce((total, day) => total + day.activities.length, 0)}</div>
                <div className="text-sm opacity-80">Activities</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Day Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="font-semibold mb-4">Itinerary Days</h3>
                <div className="space-y-2">
                  {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeDay === day
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">Day {day}</div>
                      <div className="text-sm text-gray-600">
                        {itinerary[day]?.title || `Day ${day} Activities`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Itinerary
                  </button>
                  <Link
                    to="/itinerary"
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modify Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Day {activeDay}: {itinerary[activeDay]?.title}
                </h2>
                <div className="text-sm text-gray-500">
                  {new Date(formData.startDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {itinerary[activeDay]?.activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-blue-600">{activity.time}</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full capitalize">
                                {activity.type}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">{activity.cost}</div>
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h4>
                          <p className="text-gray-600 mb-3">{activity.description}</p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {activity.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {activity.duration}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Day Summary */}
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h4 className="font-semibold mb-2">Day {activeDay} Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Activities:</span>
                    <div className="font-semibold">{itinerary[activeDay]?.activities.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <div className="font-semibold text-green-600">
                      ₹{itinerary[activeDay]?.activities.reduce((total, activity) => {
                        return total + (parseInt(activity.cost.replace('₹', '').replace(',', '')) || 0);
                      }, 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-semibold">Full Day</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <div className="font-semibold">Moderate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryResultPage;
