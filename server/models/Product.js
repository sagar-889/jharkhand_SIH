const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Handicrafts', 'Homestays', 'Events', 'Tours', 'Food', 'Transport']
  },
  subcategory: {
    type: String,
    required: function() {
      return this.category === 'Handicrafts';
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  images: [{
    public_id: String,
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: String,
    city: String,
    district: String,
    state: {
      type: String,
      default: 'Jharkhand'
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    pincode: String
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    startDate: Date,
    endDate: Date,
    maxQuantity: {
      type: Number,
      default: 1
    },
    availableQuantity: {
      type: Number,
      default: 1
    },
    bookingAdvance: {
      type: Number,
      default: 1 // days in advance
    }
  },
  features: [String],
  specifications: {
    material: String,
    dimensions: String,
    weight: String,
    color: String,
    age: String,
    condition: String
  },
  // For events
  eventDetails: {
    startTime: Date,
    endTime: Date,
    venue: String,
    capacity: Number,
    ageRestriction: String,
    dressCode: String,
    includes: [String],
    excludes: [String]
  },
  // For homestays
  homestayDetails: {
    rooms: {
      total: Number,
      available: Number,
      types: [{
        type: String,
        count: Number,
        price: Number,
        amenities: [String]
      }]
    },
    amenities: [String],
    houseRules: [String],
    checkIn: String,
    checkOut: String,
    cancellationPolicy: String
  },
  // For tours
  tourDetails: {
    duration: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging', 'Expert']
    },
    groupSize: {
      min: Number,
      max: Number
    },
    includes: [String],
    excludes: [String],
    itinerary: [{
      day: Number,
      activities: [String],
      locations: [String]
    }],
    requirements: [String]
  },
  // For food
  foodDetails: {
    cuisine: String,
    dietary: [String], // vegetarian, vegan, gluten-free, etc.
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Hot', 'Very Hot']
    },
    servingSize: String,
    preparationTime: String,
    ingredients: [String]
  },
  // For transport
  transportDetails: {
    vehicleType: String,
    capacity: Number,
    features: [String],
    driverIncluded: {
      type: Boolean,
      default: true
    },
    fuelIncluded: {
      type: Boolean,
      default: false
    },
    insurance: {
      type: Boolean,
      default: true
    }
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
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'pending'
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  policies: {
    cancellation: String,
    refund: String,
    exchange: String,
    shipping: String
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    whatsapp: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ 
  title: 'text', 
  description: 'text',
  category: 1,
  tags: 1,
  location: 1
});

// Index for filtering
productSchema.index({ 
  category: 1, 
  price: 1, 
  'availability.isAvailable': 1,
  'rating.average': -1
});

// Index for provider queries
productSchema.index({ provider: 1, createdAt: -1 });

// Index for geospatial queries
productSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (!this.availability.isAvailable) return 'unavailable';
  if (this.availability.availableQuantity <= 0) return 'sold_out';
  if (this.availability.startDate && new Date() < this.availability.startDate) return 'upcoming';
  if (this.availability.endDate && new Date() > this.availability.endDate) return 'expired';
  return 'available';
});

// Method to update rating
productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;

  // Update rating breakdown
  this.rating.breakdown = {
    five: this.reviews.filter(r => r.rating === 5).length,
    four: this.reviews.filter(r => r.rating === 4).length,
    three: this.reviews.filter(r => r.rating === 3).length,
    two: this.reviews.filter(r => r.rating === 2).length,
    one: this.reviews.filter(r => r.rating === 1).length
  };
};

// Pre-save middleware to update rating
productSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    this.updateRating();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
