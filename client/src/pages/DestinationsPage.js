import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Clock, Users, Camera, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const DestinationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const destinations = [
    {
      id: 1,
      name: "Hundru Falls",
      category: "waterfall",
      location: "Ranchi",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "One of the highest waterfalls in Jharkhand with breathtaking views and natural pools perfect for photography.",
      rating: 4.8,
      reviews: 324,
      price: "₹500",
      duration: "4-6 hours",
      difficulty: "Easy",
      bestTime: "Oct-Mar",
      highlights: ["98m waterfall", "Natural pools", "Photography", "Trekking"]
    },
    {
      id: 2,
      name: "Betla National Park",
      category: "wildlife",
      location: "Latehar",
      image: "https://images.unsplash.com/photo-1549366021-9f761d040a94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Home to tigers, elephants, and diverse wildlife species in their natural habitat.",
      rating: 4.6,
      reviews: 189,
      price: "₹800",
      duration: "Full day",
      difficulty: "Easy",
      bestTime: "Nov-Apr",
      highlights: ["Tiger safari", "Elephant spotting", "Bird watching", "Nature trails"]
    },
    {
      id: 3,
      name: "Baidyanath Temple",
      category: "temple",
      location: "Deoghar",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Sacred Jyotirlinga temple attracting millions of devotees annually.",
      rating: 4.9,
      reviews: 567,
      price: "₹300",
      duration: "2-3 hours",
      difficulty: "Easy",
      bestTime: "Year round",
      highlights: ["Jyotirlinga", "Ancient architecture", "Spiritual experience", "Festivals"]
    },
    {
      id: 4,
      name: "Netarhat Hill Station",
      category: "hill-station",
      location: "Latehar",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Known as the 'Queen of Chotanagpur' for its spectacular sunrise and sunset views.",
      rating: 4.7,
      reviews: 412,
      price: "₹1,200",
      duration: "2-3 days",
      difficulty: "Moderate",
      bestTime: "Oct-Mar",
      highlights: ["Sunrise point", "Sunset views", "Cool climate", "Trekking trails"]
    },
    {
      id: 5,
      name: "Parasnath Hill",
      category: "hill-station",
      location: "Giridih",
      image: "https://images.unsplash.com/photo-1464822759844-d150baec93d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Highest peak in Jharkhand and important Jain pilgrimage site with panoramic views.",
      rating: 4.5,
      reviews: 298,
      price: "₹1,000",
      duration: "Full day",
      difficulty: "Challenging",
      bestTime: "Oct-Mar",
      highlights: ["Highest peak", "Jain temples", "Panoramic views", "Pilgrimage"]
    },
    {
      id: 6,
      name: "Dalma Wildlife Sanctuary",
      category: "wildlife",
      location: "Jamshedpur",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Famous for elephant herds and scenic beauty with excellent trekking opportunities.",
      rating: 4.4,
      reviews: 156,
      price: "₹600",
      duration: "6-8 hours",
      difficulty: "Moderate",
      bestTime: "Nov-Apr",
      highlights: ["Elephant herds", "Trekking", "Bird watching", "Scenic beauty"]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: MapPin },
    { id: 'waterfall', name: 'Waterfalls', icon: Camera },
    { id: 'wildlife', name: 'Wildlife', icon: Users },
    { id: 'temple', name: 'Temples', icon: MapPin },
    { id: 'hill-station', name: 'Hill Stations', icon: Camera }
  ];

  const sortOptions = [
    { id: 'popular', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' }
  ];

  const filteredAndSortedDestinations = destinations
    .filter(destination => {
      const matchesSearch = destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           destination.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || destination.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return parseInt(a.price.replace('₹', '').replace(',', '')) - parseInt(b.price.replace('₹', '').replace(',', ''));
        case 'price-high':
          return parseInt(b.price.replace('₹', '').replace(',', '')) - parseInt(a.price.replace('₹', '').replace(',', ''));
        default:
          return b.reviews - a.reviews;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Explore Destinations
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover the hidden gems and popular attractions of Jharkhand's diverse landscape
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{destinations.length}+</div>
                    <div className="text-sm opacity-80">Destinations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">4.6</div>
                    <div className="text-sm opacity-80">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2K+</div>
                    <div className="text-sm opacity-80">Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search destinations, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mt-6">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {destination.category.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-semibold text-gray-900">{destination.price}</span>
                  </div>
                  <button className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{destination.rating}</span>
                      <span className="text-xs text-gray-400 ml-1">({destination.reviews})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {destination.location}
                    <Clock className="h-4 w-4 ml-4 mr-1" />
                    {destination.duration}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{destination.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {destination.highlights.slice(0, 3).map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Link
                      to={`/destinations/${destination.id}`}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors text-center font-medium"
                    >
                      View Details
                    </Link>
                    <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredAndSortedDestinations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No destinations found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria or browse all destinations</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DestinationsPage;
