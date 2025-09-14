const mongoose = require('mongoose');

// Route Schema for navigation
const routeSchema = new mongoose.Schema({
  startLocation: {
    name: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: String
  },
  endLocation: {
    name: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: String
  },
  waypoints: [{
    name: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    stopDuration: { type: Number, default: 0 } // in minutes
  }],
  distance: { type: Number, required: true }, // in kilometers
  duration: { type: Number, required: true }, // in minutes
  mode: {
    type: String,
    enum: ['driving', 'walking', 'bicycling', 'transit'],
    default: 'driving'
  },
  polyline: String, // Encoded polyline for route visualization
  steps: [{
    instruction: String,
    distance: Number,
    duration: Number,
    startLocation: {
      lat: Number,
      lng: Number
    },
    endLocation: {
      lat: Number,
      lng: Number
    },
    polyline: String
  }],
  trafficInfo: {
    congestionLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe'],
      default: 'low'
    },
    estimatedDelay: { type: Number, default: 0 }, // in minutes
    lastUpdated: { type: Date, default: Date.now }
  },
  tolls: [{
    name: String,
    cost: Number,
    location: {
      lat: Number,
      lng: Number
    }
  }],
  fuelStops: [{
    name: String,
    location: {
      lat: Number,
      lng: Number
    },
    fuelType: [String],
    pricePerLiter: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// POI (Point of Interest) Schema
const poiSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'tourist_attraction', 'restaurant', 'hotel', 'hospital', 
      'gas_station', 'atm', 'bank', 'shopping_mall', 'temple',
      'museum', 'park', 'viewpoint', 'adventure_sports', 'cultural_site'
    ],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: String,
  description: String,
  images: [String],
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  openingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open: String, // "09:00"
    close: String, // "18:00"
    closed: { type: Boolean, default: false }
  }],
  amenities: [String],
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    parkingAvailable: { type: Boolean, default: false },
    publicTransportNearby: { type: Boolean, default: false }
  },
  priceRange: {
    type: String,
    enum: ['budget', 'moderate', 'expensive', 'luxury']
  },
  tags: [String],
  verified: { type: Boolean, default: false },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
poiSchema.index({ location: '2dsphere' });

// Traffic Update Schema
const trafficUpdateSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  roadName: String,
  incidentType: {
    type: String,
    enum: ['accident', 'construction', 'road_closure', 'heavy_traffic', 'weather_related'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'moderate'
  },
  description: String,
  estimatedClearTime: Date,
  alternativeRoutes: [String],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create geospatial index for traffic updates
trafficUpdateSchema.index({ location: '2dsphere' });

// Map Layer Schema for custom map layers
const mapLayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['tourist_spots', 'restaurants', 'hotels', 'transport', 'emergency', 'cultural'],
    required: true
  },
  description: String,
  pois: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POI'
  }],
  style: {
    color: { type: String, default: '#FF0000' },
    icon: String,
    size: { type: Number, default: 20 }
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Saved Location Schema
const savedLocationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['home', 'work', 'favorite', 'visited', 'wishlist'],
    default: 'favorite'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: String,
  notes: String,
  tags: [String],
  visitDate: Date,
  rating: { type: Number, min: 1, max: 5 }
}, {
  timestamps: true
});

// Create geospatial index for saved locations
savedLocationSchema.index({ location: '2dsphere' });

// Create models
const Route = mongoose.model('Route', routeSchema);
const POI = mongoose.model('POI', poiSchema);
const TrafficUpdate = mongoose.model('TrafficUpdate', trafficUpdateSchema);
const MapLayer = mongoose.model('MapLayer', mapLayerSchema);
const SavedLocation = mongoose.model('SavedLocation', savedLocationSchema);

module.exports = {
  Route,
  POI,
  TrafficUpdate,
  MapLayer,
  SavedLocation
};
