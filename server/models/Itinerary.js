const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String
  },
  duration: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    default: 0
  },
  description: String,
  category: {
    type: String,
    enum: ['sightseeing', 'adventure', 'cultural', 'food', 'shopping', 'relaxation', 'transport']
  },
  bookingRequired: {
    type: Boolean,
    default: false
  },
  bookingInfo: {
    provider: String,
    contact: String,
    website: String,
    price: Number
  },
  weatherDependent: {
    type: Boolean,
    default: false
  },
  alternatives: [{
    activity: String,
    location: String,
    cost: Number
  }]
});

const daySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    description: String
  },
  activities: [activitySchema],
  totalCost: {
    type: Number,
    default: 0
  },
  notes: String
});

const itinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  budget: {
    total: {
      type: Number,
      required: true
    },
    perDay: Number,
    breakdown: {
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      miscellaneous: { type: Number, default: 0 }
    }
  },
  travelers: {
    count: {
      type: Number,
      required: true
    },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    seniors: { type: Number, default: 0 }
  },
  interests: [String],
  accommodation: {
    type: {
      type: String,
      enum: ['hotel', 'homestay', 'resort', 'camping'],
      required: true
    },
    preferences: [String],
    budget: Number
  },
  startLocation: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  endLocation: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  days: [daySchema],
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'planned', 'booked', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  specialRequirements: [String],
  weatherData: {
    forecast: [{
      date: Date,
      condition: String,
      temperature: Number,
      humidity: Number
    }],
    recommendations: [String]
  },
  transport: {
    mode: {
      type: String,
      enum: ['car', 'bus', 'train', 'flight', 'mixed']
    },
    options: [{
      mode: String,
      cost: Number,
      duration: String,
      provider: String,
      bookingInfo: String
    }]
  },
  accommodation: {
    recommendations: [{
      name: String,
      type: String,
      location: String,
      price: Number,
      rating: Number,
      amenities: [String],
      bookingInfo: String
    }]
  },
  localContacts: [{
    name: String,
    role: String,
    contact: String,
    location: String
  }],
  emergencyContacts: [{
    name: String,
    number: String,
    type: String
  }],
  documents: [{
    name: String,
    type: String,
    required: Boolean,
    status: {
      type: String,
      enum: ['pending', 'obtained', 'expired']
    }
  }],
  shareToken: String,
  sharedWith: [{
    email: String,
    sharedAt: Date,
    message: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search functionality
itinerarySchema.index({ 
  title: 'text', 
  description: 'text',
  interests: 1,
  tags: 1
});

// Index for user queries
itinerarySchema.index({ user: 1, createdAt: -1 });

// Index for public itineraries
itinerarySchema.index({ isPublic: 1, createdAt: -1 });

// Calculate total cost before saving
itinerarySchema.pre('save', function(next) {
  if (this.days && this.days.length > 0) {
    this.totalCost = this.days.reduce((total, day) => {
      return total + (day.totalCost || 0);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
