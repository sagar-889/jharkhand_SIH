const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { 
  getTransportOptions, 
  getLocalTransportOptions, 
  getTransportSchedule, 
  bookTransport 
} = require('../backend/services/transportService');
const Booking = require('../models/Booking');

const router = express.Router();

// @desc    Get transport options between locations
// @route   POST /api/transport/options
// @access  Public
router.post('/options', [
  body('from').isObject().withMessage('From location is required'),
  body('to').isObject().withMessage('To location is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('passengers').optional().isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20')
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

    const { from, to, date, passengers = 1, preferences = {} } = req.body;

    // Create a mock itinerary object for the transport service
    const mockItinerary = {
      days: [{
        activities: [{
          location: from
        }, {
          location: to
        }]
      }],
      startLocation: from,
      endLocation: to
    };

    const transportOptions = await getTransportOptions(mockItinerary);

    // Add additional details for each option
    const enhancedOptions = transportOptions.map(option => ({
      ...option,
      passengers,
      totalCost: option.options.map(opt => ({
        ...opt,
        totalCost: opt.cost * passengers,
        costPerPerson: opt.cost
      })),
      date: date || new Date().toISOString().split('T')[0]
    }));

    res.status(200).json({
      status: 'success',
      results: enhancedOptions.length,
      data: { transportOptions: enhancedOptions }
    });
  } catch (error) {
    console.error('Get transport options error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting transport options'
    });
  }
});

// @desc    Get local transport options within a city
// @route   GET /api/transport/local/:city
// @access  Public
router.get('/local/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const localOptions = await getLocalTransportOptions(city);

    res.status(200).json({
      status: 'success',
      results: localOptions.length,
      data: { localTransport: localOptions }
    });
  } catch (error) {
    console.error('Get local transport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting local transport options'
    });
  }
});

// @desc    Get transport schedule for specific route
// @route   GET /api/transport/schedule
// @access  Public
router.get('/schedule', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'From, to, and date parameters are required'
      });
    }

    const schedule = await getTransportSchedule(from, to, date);

    res.status(200).json({
      status: 'success',
      results: schedule.length,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get transport schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting transport schedule'
    });
  }
});

// @desc    Book transport
// @route   POST /api/transport/book
// @access  Private
router.post('/book', protect, [
  body('mode').isIn(['bus', 'train', 'taxi', 'car', 'auto_rickshaw']).withMessage('Invalid transport mode'),
  body('provider').notEmpty().withMessage('Provider is required'),
  body('from').notEmpty().withMessage('From location is required'),
  body('to').notEmpty().withMessage('To location is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('passengers').isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20'),
  body('cost').isFloat({ min: 0 }).withMessage('Valid cost is required'),
  body('contact.phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number is required'),
  body('contact.email').isEmail().withMessage('Valid email is required')
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

    const bookingData = {
      ...req.body,
      userId: req.user._id
    };

    // Book transport through service
    const transportBooking = await bookTransport(bookingData);

    // Create booking record in database
    const booking = new Booking({
      user: req.user._id,
      type: 'transport',
      item: null, // No specific item for transport
      details: {
        transportMode: req.body.mode,
        provider: req.body.provider,
        from: req.body.from,
        to: req.body.to,
        date: req.body.date,
        passengers: req.body.passengers,
        bookingId: transportBooking.id,
        contact: req.body.contact
      },
      totalAmount: req.body.cost * req.body.passengers,
      status: 'confirmed',
      bookingDate: new Date(),
      travelDate: new Date(req.body.date)
    });

    await booking.save();

    res.status(201).json({
      status: 'success',
      message: 'Transport booked successfully',
      data: { 
        booking,
        transportBooking 
      }
    });
  } catch (error) {
    console.error('Book transport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while booking transport'
    });
  }
});

// @desc    Get user's transport bookings
// @route   GET /api/transport/bookings
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { 
      user: req.user._id,
      type: 'transport'
    };
    
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { bookings }
    });
  } catch (error) {
    console.error('Get transport bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting transport bookings'
    });
  }
});

// @desc    Cancel transport booking
// @route   PUT /api/transport/bookings/:id/cancel
// @access  Private
router.put('/bookings/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'transport'
    });

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Transport booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled'
      });
    }

    // Check if cancellation is allowed (e.g., not too close to travel date)
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate - now) / (1000 * 60 * 60);

    if (hoursUntilTravel < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel booking less than 2 hours before travel time'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'User requested cancellation';

    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Transport booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel transport booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while cancelling transport booking'
    });
  }
});

// @desc    Get transport statistics
// @route   GET /api/transport/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Booking.aggregate([
      { 
        $match: { 
          user: userId,
          type: 'transport'
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          completedTrips: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          upcomingTrips: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'confirmed'] },
                    { $gte: ['$travelDate', new Date()] }
                  ]
                }, 
                1, 
                0
              ]
            }
          }
        }
      }
    ]);

    // Get transport mode breakdown
    const modeStats = await Booking.aggregate([
      { 
        $match: { 
          user: userId,
          type: 'transport'
        }
      },
      {
        $group: {
          _id: '$details.transportMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      totalAmount: 0,
      completedTrips: 0,
      cancelledBookings: 0,
      upcomingTrips: 0
    };

    res.status(200).json({
      status: 'success',
      data: { 
        stats: result,
        modeBreakdown: modeStats
      }
    });
  } catch (error) {
    console.error('Get transport stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting transport statistics'
    });
  }
});

// @desc    Get popular transport routes
// @route   GET /api/transport/popular-routes
// @access  Public
router.get('/popular-routes', async (req, res) => {
  try {
    const popularRoutes = await Booking.aggregate([
      { 
        $match: { 
          type: 'transport',
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            from: '$details.from',
            to: '$details.to'
          },
          count: { $sum: 1 },
          avgCost: { $avg: '$totalAmount' },
          modes: { $addToSet: '$details.transportMode' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      status: 'success',
      results: popularRoutes.length,
      data: { popularRoutes }
    });
  } catch (error) {
    console.error('Get popular routes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting popular routes'
    });
  }
});

// @desc    Get transport providers
// @route   GET /api/transport/providers
// @access  Public
router.get('/providers', async (req, res) => {
  try {
    const { mode, location } = req.query;
    
    // This would typically come from a database of registered providers
    const providers = [
      {
        id: 'jharkhand_roadways',
        name: 'Jharkhand State Road Transport Corporation',
        modes: ['bus'],
        coverage: ['statewide'],
        rating: 4.2,
        contact: {
          phone: '+91-651-2446666',
          website: 'https://jsrtc.co.in'
        }
      },
      {
        id: 'indian_railways',
        name: 'Indian Railways',
        modes: ['train'],
        coverage: ['nationwide'],
        rating: 4.0,
        contact: {
          phone: '139',
          website: 'https://www.irctc.co.in'
        }
      },
      {
        id: 'ola_cabs',
        name: 'Ola Cabs',
        modes: ['taxi', 'auto_rickshaw'],
        coverage: ['urban_areas'],
        rating: 4.3,
        contact: {
          phone: '+91-33-71206666',
          website: 'https://www.olacabs.com'
        }
      },
      {
        id: 'uber',
        name: 'Uber',
        modes: ['taxi'],
        coverage: ['major_cities'],
        rating: 4.4,
        contact: {
          phone: '+91-80-71176666',
          website: 'https://www.uber.com'
        }
      },
      {
        id: 'local_taxi',
        name: 'Local Taxi Services',
        modes: ['taxi'],
        coverage: ['local'],
        rating: 3.8,
        contact: {
          phone: 'Contact local taxi stands'
        }
      }
    ];

    let filteredProviders = providers;

    if (mode) {
      filteredProviders = providers.filter(provider => 
        provider.modes.includes(mode)
      );
    }

    res.status(200).json({
      status: 'success',
      results: filteredProviders.length,
      data: { providers: filteredProviders }
    });
  } catch (error) {
    console.error('Get transport providers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting transport providers'
    });
  }
});

// @desc    Get real-time vehicle tracking (mock)
// @route   GET /api/transport/track/:bookingId
// @access  Private
router.get('/track/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
      type: 'transport'
    });

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Transport booking not found'
      });
    }

    // Mock tracking data
    const trackingData = {
      bookingId: booking._id,
      vehicleNumber: `JH-01-AB-${Math.floor(Math.random() * 9999)}`,
      driverName: 'Ravi Kumar',
      driverPhone: '+91-98765-43210',
      currentLocation: {
        lat: 23.3441 + (Math.random() - 0.5) * 0.1,
        lng: 85.3096 + (Math.random() - 0.5) * 0.1,
        address: 'En route to destination'
      },
      estimatedArrival: new Date(Date.now() + Math.random() * 3600000), // Random time within 1 hour
      status: booking.status === 'confirmed' ? 'on_the_way' : booking.status,
      lastUpdated: new Date()
    };

    res.status(200).json({
      status: 'success',
      data: { tracking: trackingData }
    });
  } catch (error) {
    console.error('Track transport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while tracking transport'
    });
  }
});

module.exports = router;
