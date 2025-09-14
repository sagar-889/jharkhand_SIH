const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: 'Jharkhand'
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    address: String
  },
  category: {
    type: String,
    required: true,
    enum: ['Hill Stations', 'Wildlife', 'Waterfalls', 'Temples', 'Valleys', 'Cultural Sites', 'Adventure Sports', 'Eco Tourism']
  },
  images: [{
    public_id: String,
    url: String,
    caption: String
  }],
  vrExperience: {
    hasVR: { type: Boolean, default: false },
    vrLink: String,
    arLink: String,
    vrDescription: String
  },
  pricing: {
    entryFee: {
      adult: { type: Number, default: 0 },
      child: { type: Number, default: 0 },
      senior: { type: Number, default: 0 }
    },
    guideFee: { type: Number, default: 0 },
    parkingFee: { type: Number, default: 0 }
  },
  facilities: [{
    name: String,
    available: { type: Boolean, default: true },
    description: String
  }],
  bestTimeToVisit: [String], // ['October', 'November', 'December']
  weather: {
    current: String,
    temperature: Number,
    humidity: Number
  },
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    publicTransport: { type: Boolean, default: false },
    parkingAvailable: { type: Boolean, default: true }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    breakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    images: [String],
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  nearbyAttractions: [{
    name: String,
    distance: Number, // in km
    type: String
  }],
  localProviders: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    services: [String],
    contact: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  visitDuration: {
    min: Number, // minimum hours
    max: Number  // maximum hours
  },
  safety: {
    level: {
      type: String,
      enum: ['Very Safe', 'Safe', 'Moderate', 'Caution Required'],
      default: 'Safe'
    },
    guidelines: [String]
  }
}, {
  timestamps: true
});

// Index for search functionality
destinationSchema.index({ 
  name: 'text', 
  description: 'text', 
  'location.city': 'text',
  category: 1,
  tags: 1
});

// Index for geospatial queries
destinationSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Destination', destinationSchema);
