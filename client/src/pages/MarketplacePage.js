import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Heart, ShoppingCart, MapPin, Users, Calendar, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');

  const categories = [
    { id: 'all', name: 'All Products', icon: Package, count: 156 },
    { id: 'handicrafts', name: 'Handicrafts', icon: Package, count: 45 },
    { id: 'homestays', name: 'Homestays', icon: MapPin, count: 28 },
    { id: 'events', name: 'Events', icon: Calendar, count: 32 },
    { id: 'food', name: 'Food & Beverages', icon: Package, count: 51 }
  ];

  const products = [
    {
      id: 1,
      name: "Traditional Dokra Art Collection",
      category: "handicrafts",
      price: 2500,
      originalPrice: 3200,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Artisan Collective Ranchi",
      rating: 4.8,
      reviews: 124,
      description: "Authentic brass figurines made using traditional lost-wax casting technique by skilled tribal artisans.",
      inStock: true,
      fastDelivery: true,
      tags: ["Handmade", "Traditional", "Authentic"],
      location: "Ranchi"
    },
    {
      id: 2,
      name: "Tribal Homestay Experience",
      category: "homestays",
      price: 1800,
      originalPrice: 2200,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Village Tourism Board",
      rating: 4.6,
      reviews: 89,
      description: "Immersive cultural experience with local tribal families including traditional meals and activities.",
      inStock: true,
      fastDelivery: false,
      tags: ["Cultural", "Authentic", "Family-friendly"],
      location: "Khunti"
    },
    {
      id: 3,
      name: "Sohrai Painting Workshop",
      category: "events",
      price: 800,
      originalPrice: 1000,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Cultural Heritage Center",
      rating: 4.9,
      reviews: 67,
      description: "Learn traditional wall painting techniques from master artists in this hands-on workshop.",
      inStock: true,
      fastDelivery: false,
      tags: ["Workshop", "Art", "Traditional"],
      location: "Hazaribagh"
    },
    {
      id: 4,
      name: "Bamboo Craft Deluxe Set",
      category: "handicrafts",
      price: 1200,
      originalPrice: 1500,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Eco Craft Jharkhand",
      rating: 4.5,
      reviews: 156,
      description: "Sustainable bamboo products including baskets, decorative items, and kitchen accessories.",
      inStock: true,
      fastDelivery: true,
      tags: ["Eco-friendly", "Sustainable", "Handmade"],
      location: "Gumla"
    },
    {
      id: 5,
      name: "Forest Honey & Spice Collection",
      category: "food",
      price: 650,
      originalPrice: 800,
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Forest Produce Cooperative",
      rating: 4.7,
      reviews: 203,
      description: "Pure forest honey and traditional spices sourced directly from tribal communities.",
      inStock: true,
      fastDelivery: true,
      tags: ["Organic", "Natural", "Healthy"],
      location: "Simdega"
    },
    {
      id: 6,
      name: "Karma Festival Experience",
      category: "events",
      price: 3500,
      originalPrice: 4200,
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Festival Organizers",
      rating: 4.8,
      reviews: 92,
      description: "Complete festival experience including accommodation, meals, and cultural performances.",
      inStock: true,
      fastDelivery: false,
      tags: ["Festival", "Cultural", "Complete Package"],
      location: "Chaibasa"
    },
    {
      id: 7,
      name: "Tribal Jewelry Collection",
      category: "handicrafts",
      price: 1850,
      originalPrice: 2300,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Heritage Jewelers",
      rating: 4.6,
      reviews: 78,
      description: "Traditional silver jewelry with intricate designs passed down through generations.",
      inStock: true,
      fastDelivery: true,
      tags: ["Silver", "Traditional", "Handcrafted"],
      location: "Dumka"
    },
    {
      id: 8,
      name: "Organic Turmeric & Herbs",
      category: "food",
      price: 450,
      originalPrice: 600,
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      seller: "Tribal Farmers Union",
      rating: 4.4,
      reviews: 134,
      description: "Premium quality turmeric and medicinal herbs grown using traditional organic methods.",
      inStock: true,
      fastDelivery: true,
      tags: ["Organic", "Medicinal", "Pure"],
      location: "Lohardaga"
    }
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under-500', name: 'Under ₹500' },
    { id: '500-1500', name: '₹500 - ₹1,500' },
    { id: '1500-3000', name: '₹1,500 - ₹3,000' },
    { id: 'above-3000', name: 'Above ₹3,000' }
  ];

  const sortOptions = [
    { id: 'popular', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'newest', name: 'Newest First' }
  ];

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.seller.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesPrice = true;
      if (priceRange !== 'all') {
        switch (priceRange) {
          case 'under-500':
            matchesPrice = product.price < 500;
            break;
          case '500-1500':
            matchesPrice = product.price >= 500 && product.price <= 1500;
            break;
          case '1500-3000':
            matchesPrice = product.price >= 1500 && product.price <= 3000;
            break;
          case 'above-3000':
            matchesPrice = product.price > 3000;
            break;
        }
      }
      
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return b.id - a.id;
        default:
          return b.reviews - a.reviews;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Local Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover authentic handicrafts, unique homestays, and cultural experiences directly from local artisans and communities
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{products.length}+</div>
                    <div className="text-sm opacity-80">Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">50+</div>
                    <div className="text-sm opacity-80">Local Sellers</div>
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
          <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products, sellers, experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
              
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {priceRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProducts.length} Products Found
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.originalPrice > product.price && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </span>
                    )}
                    {product.fastDelivery && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Fast Delivery
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <ShoppingCart className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {product.location}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Users className="h-3 w-3 mr-1" />
                    {product.seller}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-purple-600">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/marketplace/${product.id}`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria or browse all categories</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange('all');
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
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

export default MarketplacePage;
