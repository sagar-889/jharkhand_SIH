const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { generateItinerary } = require('../services/aiService');
const { getWeatherData } = require('../services/weatherService');
const { getTransportOptions } = require('../services/transportService');
const Itinerary = require('../models/Itinerary');

const router = express.Router();

// @desc    Generate AI-powered itinerary
// @route   POST /api/itinerary/generate
// @access  Private
router.post('/generate', protect, [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('duration').isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 days'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('travelers').isInt({ min: 1, max: 20 }).withMessage('Number of travelers must be between 1 and 20'),
  body('interests').isArray().withMessage('Interests must be an array'),
  body('accommodation').isIn(['hotel', 'homestay', 'resort', 'camping']).withMessage('Invalid accommodation type'),
  body('startLocation').optional().isString(),
  body('endLocation').optional().isString()
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

    const {
      startDate,
      duration,
      budget,
      travelers,
      interests,
      accommodation,
      startLocation = 'Ranchi',
      endLocation,
      specialRequirements = []
    } = req.body;

    // Get weather data for the trip period
    const weatherData = await getWeatherData(startDate, duration);

    // Generate AI itinerary
    const itineraryData = await generateItinerary({
      startDate,
      duration,
      budget,
      travelers,
      interests,
      accommodation,
      startLocation,
      endLocation,
      specialRequirements,
      weatherData,
      userPreferences: req.user.preferences
    });

    // Save itinerary to database
    const itinerary = new Itinerary({
      user: req.user._id,
      ...itineraryData,
      generatedAt: new Date()
    });

    await itinerary.save();

    res.status(201).json({
      status: 'success',
      message: 'Itinerary generated successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating itinerary'
    });
  }
});

// @desc    Get user's itineraries
// @route   GET /api/itinerary
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const itineraries = await Itinerary.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Itinerary.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: itineraries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { itineraries }
    });
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching itineraries'
    });
  }
});

// @desc    Get single itinerary
// @route   GET /api/itinerary/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching itinerary'
    });
  }
});

// @desc    Update itinerary
// @route   PUT /api/itinerary/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Itinerary updated successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating itinerary'
    });
  }
});

// @desc    Delete itinerary
// @route   DELETE /api/itinerary/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting itinerary'
    });
  }
});

// @desc    Share itinerary
// @route   POST /api/itinerary/:id/share
// @access  Private
router.post('/:id/share', protect, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').optional().isString()
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

    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    // Generate shareable link
    const shareToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    itinerary.shareToken = shareToken;
    itinerary.sharedWith = [...(itinerary.sharedWith || []), {
      email: req.body.email,
      sharedAt: new Date(),
      message: req.body.message
    }];
    
    await itinerary.save();

    const shareUrl = `${req.protocol}://${req.get('host')}/api/itinerary/shared/${shareToken}`;

    res.status(200).json({
      status: 'success',
      message: 'Itinerary shared successfully',
      data: { shareUrl }
    });
  } catch (error) {
    console.error('Share itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while sharing itinerary'
    });
  }
});

// @desc    Get shared itinerary
// @route   GET /api/itinerary/shared/:token
// @access  Public
router.get('/shared/:token', async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      shareToken: req.params.token
    }).populate('user', 'firstName lastName');

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Shared itinerary not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Get shared itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching shared itinerary'
    });
  }
});

// @desc    Get transport options for itinerary
// @route   GET /api/itinerary/:id/transport
// @access  Private
router.get('/:id/transport', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    const transportOptions = await getTransportOptions(itinerary);

    res.status(200).json({
      status: 'success',
      data: { transportOptions }
    });
  } catch (error) {
    console.error('Get transport options error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching transport options'
    });
  }
});

// @desc    Rate itinerary
// @route   POST /api/itinerary/:id/rate
// @access  Private
router.post('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString()
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

    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    itinerary.rating = {
      score: req.body.rating,
      review: req.body.review,
      ratedAt: new Date()
    };

    await itinerary.save();

    res.status(200).json({
      status: 'success',
      message: 'Itinerary rated successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Rate itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while rating itinerary'
    });
  }
});

// @desc    Get itinerary statistics
// @route   GET /api/itinerary/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Itinerary.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalItineraries: { $sum: 1 },
          totalDays: { $sum: '$duration' },
          totalBudget: { $sum: '$budget.total' },
          avgRating: { $avg: '$rating.score' },
          completedTrips: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          upcomingTrips: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalItineraries: 0,
      totalDays: 0,
      totalBudget: 0,
      avgRating: 0,
      completedTrips: 0,
      upcomingTrips: 0
    };

    res.status(200).json({
      status: 'success',
      data: { stats: result }
    });
  } catch (error) {
    console.error('Get itinerary stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching statistics'
    });
  }
});

// @desc    Export itinerary to PDF
// @route   GET /api/itinerary/:id/export
// @access  Private
router.get('/:id/export', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    // Generate PDF export data
    const exportData = {
      title: itinerary.title,
      duration: itinerary.duration,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      budget: itinerary.budget,
      travelers: itinerary.travelers,
      days: itinerary.days,
      contacts: itinerary.emergencyContacts,
      documents: itinerary.documents,
      generatedAt: new Date()
    };

    res.status(200).json({
      status: 'success',
      message: 'Itinerary export data generated',
      data: { exportData }
    });
  } catch (error) {
    console.error('Export itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while exporting itinerary'
    });
  }
});

// @desc    Get weather updates for itinerary
// @route   GET /api/itinerary/:id/weather
// @access  Private
router.get('/:id/weather', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    const { getWeatherData, getWeatherRecommendations } = require('../services/weatherService');
    
    const weatherData = await getWeatherData(itinerary.startDate, itinerary.duration);
    const recommendations = getWeatherRecommendations(weatherData);

    res.status(200).json({
      status: 'success',
      data: { 
        weather: weatherData,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get weather updates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching weather updates'
    });
  }
});

// @desc    Regenerate itinerary with new preferences
// @route   POST /api/itinerary/:id/regenerate
// @access  Private
router.post('/:id/regenerate', protect, [
  body('preferences').optional().isObject(),
  body('budget').optional().isFloat({ min: 0 }),
  body('interests').optional().isArray()
], async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    // Update preferences and regenerate
    const updatedPreferences = {
      ...itinerary.toObject(),
      ...req.body
    };

    const newItineraryData = await generateItinerary(updatedPreferences);
    
    // Update existing itinerary
    Object.assign(itinerary, newItineraryData);
    itinerary.lastModified = new Date();
    
    await itinerary.save();

    res.status(200).json({
      status: 'success',
      message: 'Itinerary regenerated successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Regenerate itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while regenerating itinerary'
    });
  }
});

module.exports = router;
