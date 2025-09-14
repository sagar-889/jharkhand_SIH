import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Users, Camera, Calendar, Phone, Globe, Share2, Heart, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

const DestinationDetailPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(0);

  // Mock destination data - in real app, fetch based on ID
  const destination = {
    id: 1,
    name: "Hundru Falls",
    category: "waterfall",
    location: "Ranchi, Jharkhand",
    coordinates: { lat: 23.4241, lng: 85.6183 },
    rating: 4.8,
    reviews: 324,
    price: "₹500",
    duration: "4-6 hours",
    difficulty: "Easy",
    bestTime: "October to March",
    description: "Hundru Falls is one of the most spectacular waterfalls in Jharkhand, cascading from a height of 98 meters. Located on the Subarnarekha River, this natural wonder offers breathtaking views and is perfect for photography enthusiasts and nature lovers.",
    highlights: ["98m waterfall", "Natural pools", "Photography", "Trekking", "Picnic spots", "Monsoon beauty"],
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464822759844-d150baec93d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549366021-9f761d040a94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    ],
    facilities: [
      "Parking available",
      "Restrooms",
      "Food stalls",
      "Guide services",
      "First aid",
      "Photography spots"
    ],
    activities: [
      { name: "Photography", duration: "1-2 hours", difficulty: "Easy" },
      { name: "Nature walk", duration: "30 mins", difficulty: "Easy" },
      { name: "Swimming", duration: "1 hour", difficulty: "Moderate" },
      { name: "Trekking", duration: "2-3 hours", difficulty: "Moderate" }
    ],
    nearbyAttractions: [
      { name: "Jonha Falls", distance: "15 km", time: "30 mins" },
      { name: "Ranchi Lake", distance: "25 km", time: "45 mins" },
      { name: "Tagore Hill", distance: "30 km", time: "1 hour" }
    ],
    guides: [
      {
        id: 1,
        name: "Rajesh Kumar",
        rating: 4.9,
        experience: "8 years",
        languages: ["Hindi", "English", "Bengali"],
        price: "₹800/day",
        specialties: ["Wildlife", "Photography", "Local culture"]
      },
      {
        id: 2,
        name: "Priya Singh",
        rating: 4.7,
        experience: "5 years",
        languages: ["Hindi", "English"],
        price: "₹600/day",
        specialties: ["Nature walks", "Bird watching", "History"]
      }
    ],
    stays: [
      {
        id: 1,
        name: "Forest Rest House",
        type: "Government",
        rating: 4.2,
        price: "₹1,200/night",
        distance: "2 km",
        amenities: ["WiFi", "Restaurant", "Parking"]
      },
      {
        id: 2,
        name: "Eco Resort Ranchi",
        type: "Private",
        rating: 4.5,
        price: "₹2,500/night",
        distance: "5 km",
        amenities: ["Pool", "Spa", "Restaurant", "WiFi"]
      }
    ]
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: MapPin },
    { id: 'activities', name: 'Activities', icon: Camera },
    { id: 'guides', name: 'Book Guide', icon: Users },
    { id: 'stays', name: 'Book Stay', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/destinations"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Destinations
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{destination.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {destination.location}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <Heart className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                <Bookmark className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative rounded-2xl overflow-hidden mb-4">
                <img
                  src={destination.images[selectedImage]}
                  alt={destination.name}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImage + 1} / {destination.images.length}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {destination.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${destination.name} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">About {destination.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{destination.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-3">Highlights</h4>
                      <div className="flex flex-wrap gap-2">
                        {destination.highlights.map((highlight, index) => (
                          <span
                            key={index}
                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Facilities</h4>
                      <ul className="space-y-1">
                        {destination.facilities.map((facility, index) => (
                          <li key={index} className="text-gray-600 text-sm flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            {facility}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Map Embed */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Location</h4>
                    <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>Interactive Map</p>
                        <p className="text-sm">Lat: {destination.coordinates.lat}, Lng: {destination.coordinates.lng}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nearby Attractions */}
                  <div>
                    <h4 className="font-semibold mb-3">Nearby Attractions</h4>
                    <div className="space-y-3">
                      {destination.nearbyAttractions.map((attraction, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium">{attraction.name}</h5>
                            <p className="text-sm text-gray-600">{attraction.distance} • {attraction.time}</p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Available Activities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {destination.activities.map((activity, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{activity.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Duration: {activity.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Difficulty: {activity.difficulty}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'guides' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Local Guides</h3>
                  <div className="space-y-4">
                    {destination.guides.map((guide) => (
                      <div key={guide.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{guide.name}</h4>
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">{guide.rating}</span>
                              <span className="text-sm text-gray-400 ml-2">{guide.experience} experience</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">{guide.price}</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Languages: {guide.languages.join(', ')}</p>
                          <p className="text-sm text-gray-600">Specialties: {guide.specialties.join(', ')}</p>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Book Guide
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stays' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Nearby Accommodations</h3>
                  <div className="space-y-4">
                    {destination.stays.map((stay) => (
                      <div key={stay.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{stay.name}</h4>
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">{stay.rating}</span>
                              <span className="text-sm text-gray-400 ml-2">{stay.type}</span>
                              <span className="text-sm text-gray-400 ml-2">• {stay.distance}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">{stay.price}</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">Amenities: {stay.amenities.join(', ')}</p>
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Book Stay
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              {/* Quick Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold ml-1">{destination.rating}</span>
                    <span className="text-gray-500 ml-1">({destination.reviews} reviews)</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{destination.price}</div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-3" />
                    <span className="text-sm">Duration: {destination.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-3" />
                    <span className="text-sm">Difficulty: {destination.difficulty}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-3" />
                    <span className="text-sm">Best time: {destination.bestTime}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Book Now
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                    Add to Itinerary
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3" />
                    <span className="text-sm">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-3" />
                    <span className="text-sm">info@jharkhnadtourism.com</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailPage;
