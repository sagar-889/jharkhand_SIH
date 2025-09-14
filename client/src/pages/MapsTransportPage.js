import React, { useState } from 'react';
import { MapPin, Navigation, Car, Bus, Train, Plane, Clock, DollarSign, Navigation2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

const MapsTransportPage = () => {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [transportMode, setTransportMode] = useState('car');
  const [activeTab, setActiveTab] = useState('map');

  const destinations = [
    {
      id: 1,
      name: "Hundru Falls",
      coordinates: { lat: 23.4241, lng: 85.6183 },
      distance: "45 km from Ranchi",
      description: "Spectacular 98m waterfall",
      transportOptions: {
        car: { time: "1.5 hours", cost: "₹800", route: "Via NH33" },
        bus: { time: "2 hours", cost: "₹150", route: "State Bus Service" },
        train: { time: "N/A", cost: "N/A", route: "No direct train" }
      }
    },
    {
      id: 2,
      name: "Betla National Park",
      coordinates: { lat: 23.8859, lng: 84.1917 },
      distance: "170 km from Ranchi",
      description: "Wildlife sanctuary with tigers and elephants",
      transportOptions: {
        car: { time: "4 hours", cost: "₹2,500", route: "Via NH75" },
        bus: { time: "5 hours", cost: "₹300", route: "Ranchi-Daltonganj Bus" },
        train: { time: "6 hours", cost: "₹200", route: "Ranchi-Daltonganj Express" }
      }
    },
    {
      id: 3,
      name: "Netarhat",
      coordinates: { lat: 23.4667, lng: 84.2667 },
      distance: "156 km from Ranchi",
      description: "Queen of Chotanagpur hill station",
      transportOptions: {
        car: { time: "4 hours", cost: "₹2,200", route: "Via Gumla" },
        bus: { time: "5.5 hours", cost: "₹250", route: "State Transport" },
        train: { time: "N/A", cost: "N/A", route: "No direct train" }
      }
    },
    {
      id: 4,
      name: "Deoghar (Baidyanath Temple)",
      coordinates: { lat: 24.4833, lng: 86.7 },
      distance: "250 km from Ranchi",
      description: "Sacred Jyotirlinga temple",
      transportOptions: {
        car: { time: "5 hours", cost: "₹3,500", route: "Via NH114A" },
        bus: { time: "6 hours", cost: "₹400", route: "Ranchi-Deoghar Express" },
        train: { time: "4 hours", cost: "₹300", route: "Ranchi-Jasidih Junction" }
      }
    },
    {
      id: 5,
      name: "Parasnath Hill",
      coordinates: { lat: 23.9667, lng: 86.1667 },
      distance: "165 km from Ranchi",
      description: "Highest peak in Jharkhand",
      transportOptions: {
        car: { time: "3.5 hours", cost: "₹2,000", route: "Via Hazaribagh" },
        bus: { time: "4.5 hours", cost: "₹200", route: "Ranchi-Giridih Bus" },
        train: { time: "3 hours", cost: "₹150", route: "Ranchi-Parasnath Station" }
      }
    }
  ];

  const transportModes = [
    { id: 'car', name: 'Private Car', icon: Car, color: 'bg-blue-500' },
    { id: 'bus', name: 'Bus', icon: Bus, color: 'bg-green-500' },
    { id: 'train', name: 'Train', icon: Train, color: 'bg-purple-500' },
    { id: 'flight', name: 'Flight', icon: Plane, color: 'bg-red-500' }
  ];

  const tabs = [
    { id: 'map', name: 'Interactive Map', icon: MapPin },
    { id: 'routes', name: 'Route Planner', icon: Navigation2 },
    { id: 'transport', name: 'Transport Info', icon: Car }
  ];

  const realTimeUpdates = [
    {
      route: "Ranchi - Hundru Falls",
      status: "Clear",
      traffic: "Light",
      weather: "Sunny",
      lastUpdated: "5 mins ago"
    },
    {
      route: "Ranchi - Netarhat",
      status: "Construction",
      traffic: "Moderate",
      weather: "Cloudy",
      lastUpdated: "10 mins ago"
    },
    {
      route: "Ranchi - Betla",
      status: "Clear",
      traffic: "Heavy",
      weather: "Light Rain",
      lastUpdated: "2 mins ago"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Maps & Transport
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Navigate Jharkhand with real-time information and route planning
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
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

        {/* Interactive Map Tab */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Jharkhand Tourism Map</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <Navigation className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="rounded-xl h-96 overflow-hidden">
                  <MapContainer center={[23.5, 85.5]} zoom={7} style={{ height: '24rem', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {destinations.map((dest) => (
                      <CircleMarker
                        key={dest.id}
                        center={[dest.coordinates.lat, dest.coordinates.lng]}
                        radius={8}
                        pathOptions={{ color: selectedDestination?.id === dest.id ? '#ef4444' : '#6366f1', fillOpacity: 1 }}
                        eventHandlers={{
                          click: () => setSelectedDestination(dest),
                        }}
                      >
                        <Popup>
                          <div className="font-medium">{dest.name}</div>
                          <div className="text-sm text-gray-600">{dest.distance}</div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Destination Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Destinations</h3>
                <div className="space-y-3">
                  {destinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => setSelectedDestination(dest)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDestination?.id === dest.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{dest.name}</div>
                      <div className="text-sm text-gray-600">{dest.distance}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Destination Details */}
              {selectedDestination && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-3">{selectedDestination.name}</h3>
                  <p className="text-gray-600 mb-4">{selectedDestination.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedDestination.distance}
                    </div>
                    
                    <div className="pt-3 border-t">
                      <h4 className="font-medium mb-2">Quick Transport</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedDestination.transportOptions).map(([mode, info]) => (
                          info.time !== "N/A" && (
                            <div key={mode} className="flex justify-between text-sm">
                              <span className="capitalize">{mode}:</span>
                              <span>{info.time} • {info.cost}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Route Planner Tab */}
        {activeTab === 'routes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Plan Your Route</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>Ranchi (Current Location)</option>
                    <option>Jamshedpur</option>
                    <option>Dhanbad</option>
                    <option>Bokaro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>Select destination</option>
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>{dest.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {transportModes.slice(0, 4).map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setTransportMode(mode.id)}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            transportMode === mode.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">{mode.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                Get Directions
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Real-time Updates</h3>
              
              <div className="space-y-4">
                {realTimeUpdates.map((update, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{update.route}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        update.status === 'Clear' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {update.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                      <div>Traffic: {update.traffic}</div>
                      <div>Weather: {update.weather}</div>
                      <div>Updated: {update.lastUpdated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transport Info Tab */}
        {activeTab === 'transport' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Transport Options</h3>
              
              <div className="space-y-6">
                {transportModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <div key={mode.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className={`w-10 h-10 ${mode.color} rounded-lg flex items-center justify-center mr-3`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold">{mode.name}</h4>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {mode.id === 'car' && "Most flexible option with door-to-door service. Ideal for families and groups."}
                        {mode.id === 'bus' && "Economical choice with regular services to major destinations."}
                        {mode.id === 'train' && "Comfortable for long distances with scenic routes through the state."}
                        {mode.id === 'flight' && "Fastest option available from Birsa Munda Airport, Ranchi."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Travel Tips</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>Best time to travel is October to March for pleasant weather</div>
                  </div>
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>Book accommodations in advance during peak season</div>
                  </div>
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>Carry valid ID for wildlife sanctuary entries</div>
                  </div>
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>Local guides available at major tourist destinations</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tourist Helpline:</span>
                    <span className="font-medium">1363</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Police:</span>
                    <span className="font-medium">100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical Emergency:</span>
                    <span className="font-medium">108</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fire Service:</span>
                    <span className="font-medium">101</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapsTransportPage;
