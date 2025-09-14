const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { 
  getDirections, 
  searchPlaces, 
  getPlaceDetails, 
  getNearbyPOIs, 
  getTrafficInfo,
  geocodeAddress,
  reverseGeocode,
  getElevation,
  getStaticMapUrl
} = require('../services/mapsService');
const { Route, POI, TrafficUpdate, MapLayer, SavedLocation } = require('../models/Map');

const router = express.Router();

// @desc    Get directions between two points
// @route   POST /api/maps/directions
// @access  Public
router.post('/directions', [
  body('origin').isObject().withMessage('Origin coordinates are required'),
  body('destination').isObject().withMessage('Destination coordinates are required'),
  body('mode').optional().isIn(['driving', 'walking', 'bicycling', 'transit']).withMessage('Invalid travel mode')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { origin, destination, waypoints = [], options = {} } = req.body;

    const routes = await getDirections(origin, destination, {
      ...options,
      waypoints
    });

    // Save route if user is authenticated
    if (req.user && routes.length > 0) {
      const routeData = new Route({
        startLocation: {
          name: origin.name || 'Start Location',
          coordinates: origin,
          address: origin.address
        },
        endLocation: {
          name: destination.name || 'End Location',
          coordinates: destination,
          address: destination.address
        },
        waypoints: waypoints.map(wp => ({
          name: wp.name || 'Waypoint',
          coordinates: wp
        })),
        distance: routes[0].distance,
        duration: routes[0].duration,
        mode: options.mode || 'driving',
        polyline: routes[0].polyline,
        steps: routes[0].steps,
        createdBy: req.user._id
      });

      await routeData.save();
    }

    res.status(200).json({
      status: 'success',
      results: routes.length,
      data: { routes }
    });
  } catch (error) {
    console.error('Get directions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting directions'
    });
  }
});

// @desc    Search for places
// @route   GET /api/maps/places/search
// @access  Public
router.get('/places/search', async (req, res) => {
  try {
    const { 
      query, 
      lat, 
      lng, 
      radius = 5000, 
      type, 
      minPrice, 
      maxPrice, 
      openNow 
    } = req.query;

    if (!query || !lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Query, latitude, and longitude are required'
      });
    }

    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const options = {
      radius: parseInt(radius),
      type,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      openNow: openNow === 'true'
    };

    const places = await searchPlaces(query, location, options);

    res.status(200).json({
      status: 'success',
      results: places.length,
      data: { places }
    });
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while searching places'
    });
  }
});

// @desc    Get place details
// @route   GET /api/maps/places/:placeId
// @access  Public
router.get('/places/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const place = await getPlaceDetails(placeId);

    if (!place) {
      return res.status(404).json({
        status: 'error',
        message: 'Place not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { place }
    });
  } catch (error) {
    console.error('Get place details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting place details'
    });
  }
});

// @desc    Get nearby POIs
// @route   GET /api/maps/pois/nearby
// @access  Public
router.get('/pois/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, category, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const options = {
      radius: parseInt(radius),
      category,
      limit: parseInt(limit)
    };

    const pois = await getNearbyPOIs(location, options);

    res.status(200).json({
      status: 'success',
      results: pois.length,
      data: { pois }
    });
  } catch (error) {
    console.error('Get nearby POIs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting nearby POIs'
    });
  }
});

// @desc    Add new POI
// @route   POST /api/maps/pois
// @access  Private
router.post('/pois', protect, [
  body('name').notEmpty().withMessage('POI name is required'),
  body('category').isIn([
    'tourist_attraction', 'restaurant', 'hotel', 'hospital', 
    'gas_station', 'atm', 'bank', 'shopping_mall', 'temple',
    'museum', 'park', 'viewpoint', 'adventure_sports', 'cultural_site'
  ]).withMessage('Invalid POI category'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const poiData = {
      ...req.body,
      addedBy: req.user._id
    };

    const poi = new POI(poiData);
    await poi.save();

    res.status(201).json({
      status: 'success',
      message: 'POI added successfully',
      data: { poi }
    });
  } catch (error) {
    console.error('Add POI error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding POI'
    });
  }
});

// @desc    Update POI
// @route   PUT /api/maps/pois/:id
// @access  Private
router.put('/pois/:id', protect, async (req, res) => {
  try {
    const poi = await POI.findById(req.params.id);

    if (!poi) {
      return res.status(404).json({
        status: 'error',
        message: 'POI not found'
      });
    }

    // Check if user is the owner or admin
    if (poi.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this POI'
      });
    }

    const updatedPOI = await POI.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'POI updated successfully',
      data: { poi: updatedPOI }
    });
  } catch (error) {
    console.error('Update POI error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating POI'
    });
  }
});

// @desc    Delete POI
// @route   DELETE /api/maps/pois/:id
// @access  Private
router.delete('/pois/:id', protect, async (req, res) => {
  try {
    const poi = await POI.findById(req.params.id);

    if (!poi) {
      return res.status(404).json({
        status: 'error',
        message: 'POI not found'
      });
    }

    // Check if user is the owner or admin
    if (poi.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this POI'
      });
    }

    await POI.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'POI deleted successfully'
    });
  } catch (error) {
    console.error('Delete POI error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting POI'
    });
  }
});

// @desc    Get traffic information for route
// @route   POST /api/maps/traffic
// @access  Public
router.post('/traffic', [
  body('startLocation').isObject().withMessage('Start location is required'),
  body('endLocation').isObject().withMessage('End location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const trafficInfo = await getTrafficInfo(req.body);

    res.status(200).json({
      status: 'success',
      data: { trafficInfo }
    });
  } catch (error) {
    console.error('Get traffic info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting traffic information'
    });
  }
});

// @desc    Report traffic incident
// @route   POST /api/maps/traffic/report
// @access  Private
router.post('/traffic/report', protect, [
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates are required'),
  body('incidentType').isIn(['accident', 'construction', 'road_closure', 'heavy_traffic', 'weather_related']).withMessage('Invalid incident type'),
  body('severity').optional().isIn(['low', 'moderate', 'high', 'critical']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const trafficUpdate = new TrafficUpdate({
      ...req.body,
      reportedBy: req.user._id
    });

    await trafficUpdate.save();

    res.status(201).json({
      status: 'success',
      message: 'Traffic incident reported successfully',
      data: { trafficUpdate }
    });
  } catch (error) {
    console.error('Report traffic error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while reporting traffic incident'
    });
  }
});

// @desc    Get active traffic updates
// @route   GET /api/maps/traffic/updates
// @access  Public
router.get('/traffic/updates', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    let query = { active: true };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const trafficUpdates = await TrafficUpdate.find(query)
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      results: trafficUpdates.length,
      data: { trafficUpdates }
    });
  } catch (error) {
    console.error('Get traffic updates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting traffic updates'
    });
  }
});

// @desc    Geocode address
// @route   GET /api/maps/geocode
// @access  Public
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address is required'
      });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { result }
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while geocoding address'
    });
  }
});

// @desc    Reverse geocode coordinates
// @route   GET /api/maps/reverse-geocode
// @access  Public
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Location not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { result }
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while reverse geocoding'
    });
  }
});

// @desc    Get elevation data
// @route   POST /api/maps/elevation
// @access  Public
router.post('/elevation', [
  body('locations').isArray({ min: 1 }).withMessage('At least one location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { locations } = req.body;
    const elevationData = await getElevation(locations);

    res.status(200).json({
      status: 'success',
      results: elevationData.length,
      data: { elevations: elevationData }
    });
  } catch (error) {
    console.error('Get elevation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting elevation data'
    });
  }
});

// @desc    Save location to user's saved places
// @route   POST /api/maps/saved-locations
// @access  Private
router.post('/saved-locations', protect, [
  body('name').notEmpty().withMessage('Location name is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates are required'),
  body('category').optional().isIn(['home', 'work', 'favorite', 'visited', 'wishlist']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const savedLocation = new SavedLocation({
      ...req.body,
      user: req.user._id
    });

    await savedLocation.save();

    res.status(201).json({
      status: 'success',
      message: 'Location saved successfully',
      data: { savedLocation }
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while saving location'
    });
  }
});

// @desc    Get user's saved locations
// @route   GET /api/maps/saved-locations
// @access  Private
router.get('/saved-locations', protect, async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = { user: req.user._id };
    if (category) filter.category = category;

    const savedLocations = await SavedLocation.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: savedLocations.length,
      data: { savedLocations }
    });
  } catch (error) {
    console.error('Get saved locations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting saved locations'
    });
  }
});

// @desc    Get static map URL
// @route   GET /api/maps/static
// @access  Public
router.get('/static', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      zoom = 12, 
      size = '600x400',
      markers 
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const center = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const parsedMarkers = markers ? JSON.parse(markers) : [];

    const mapUrl = getStaticMapUrl(center, parseInt(zoom), size, parsedMarkers);

    res.status(200).json({
      status: 'success',
      data: { mapUrl }
    });
  } catch (error) {
    console.error('Get static map error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating static map'
    });
  }
});

// @desc    Get user's route history
// @route   GET /api/maps/routes/history
// @access  Private
router.get('/routes/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const routes = await Route.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Route.countDocuments({ createdBy: req.user._id });

    res.status(200).json({
      status: 'success',
      results: routes.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { routes }
    });
  } catch (error) {
    console.error('Get route history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting route history'
    });
  }
});

module.exports = router;
