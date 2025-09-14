const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Destination = require('../models/Destination');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all destinations with filtering and search
// @route   GET /api/destinations
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['Hill Stations', 'Wildlife', 'Waterfalls', 'Temples', 'Valleys', 'Cultural Sites', 'Adventure Sports', 'Eco Tourism']),
  query('search').optional().isString(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('lat').optional().isFloat(),
  query('lng').optional().isFloat(),
  query('radius').optional().isFloat({ min: 0 })
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
      page = 1,
      limit = 10,
      category,
      search,
      minRating,
      maxPrice,
      lat,
      lng,
      radius = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };
    if (maxPrice) filter['pricing.entryFee.adult'] = { $lte: parseFloat(maxPrice) };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Geospatial search
    let geoFilter = {};
    if (lat && lng) {
      geoFilter = {
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const destinations = await Destination.find({ ...filter, ...geoFilter })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviews.user', 'firstName lastName avatar')
      .populate('localProviders.provider', 'firstName lastName businessDetails');

    const total = await Destination.countDocuments({ ...filter, ...geoFilter });

    res.status(200).json({
      status: 'success',
      results: destinations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { destinations }
    });
  } catch (error) {
    console.error('Get destinations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching destinations'
    });
  }
});

// @desc    Get single destination
// @route   GET /api/destinations/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)
      .populate('reviews.user', 'firstName lastName avatar')
      .populate('localProviders.provider', 'firstName lastName businessDetails contact');

    if (!destination || !destination.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { destination }
    });
  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching destination'
    });
  }
});

// @desc    Create destination
// @route   POST /api/destinations
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['Hill Stations', 'Wildlife', 'Waterfalls', 'Temples', 'Valleys', 'Cultural Sites', 'Adventure Sports', 'Eco Tourism']),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.district').notEmpty().withMessage('District is required'),
  body('location.coordinates.lat').isFloat().withMessage('Valid latitude is required'),
  body('location.coordinates.lng').isFloat().withMessage('Valid longitude is required')
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

    const destination = new Destination(req.body);
    await destination.save();

    res.status(201).json({
      status: 'success',
      message: 'Destination created successfully',
      data: { destination }
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating destination'
    });
  }
});

// @desc    Update destination
// @route   PUT /api/destinations/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Destination updated successfully',
      data: { destination }
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating destination'
    });
  }
});

// @desc    Delete destination
// @route   DELETE /api/destinations/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Destination deleted successfully'
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting destination'
    });
  }
});

// @desc    Add review to destination
// @route   POST /api/destinations/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
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

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    // Check if user already reviewed
    const existingReview = destination.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this destination'
      });
    }

    const review = {
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
      images: req.body.images || []
    };

    destination.reviews.push(review);

    // Update rating statistics
    const totalReviews = destination.reviews.length;
    const totalRating = destination.reviews.reduce((sum, review) => sum + review.rating, 0);
    destination.rating.average = totalRating / totalReviews;
    destination.rating.count = totalReviews;

    // Update rating breakdown
    destination.rating.breakdown = {
      five: destination.reviews.filter(r => r.rating === 5).length,
      four: destination.reviews.filter(r => r.rating === 4).length,
      three: destination.reviews.filter(r => r.rating === 3).length,
      two: destination.reviews.filter(r => r.rating === 2).length,
      one: destination.reviews.filter(r => r.rating === 1).length
    };

    await destination.save();

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding review'
    });
  }
});

// @desc    Get featured destinations
// @route   GET /api/destinations/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const destinations = await Destination.find({ 
      featured: true, 
      isActive: true 
    })
    .sort({ 'rating.average': -1 })
    .limit(6)
    .populate('reviews.user', 'firstName lastName avatar');

    res.status(200).json({
      status: 'success',
      data: { destinations }
    });
  } catch (error) {
    console.error('Get featured destinations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching featured destinations'
    });
  }
});

// @desc    Get nearby destinations
// @route   GET /api/destinations/nearby/:lat/:lng
// @access  Public
router.get('/nearby/:lat/:lng', [
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number')
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

    const { lat, lng } = req.params;
    const radius = parseFloat(req.query.radius) || 50; // Default 50km

    const destinations = await Destination.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .sort({ 'rating.average': -1 })
    .limit(10)
    .populate('reviews.user', 'firstName lastName avatar');

    res.status(200).json({
      status: 'success',
      data: { destinations }
    });
  } catch (error) {
    console.error('Get nearby destinations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching nearby destinations'
    });
  }
});

// @desc    Upload destination images
// @route   POST /api/destinations/:id/images
// @access  Private (Admin only)
router.post('/:id/images', protect, authorize('admin'), upload.array('images', 10), async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    // Add new images to destination
    const newImages = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
      caption: req.body.caption || ''
    }));

    destination.images.push(...newImages);
    await destination.save();

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: { images: newImages }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while uploading images'
    });
  }
});

// @desc    Update VR/AR experience
// @route   PUT /api/destinations/:id/vr-experience
// @access  Private (Admin only)
router.put('/:id/vr-experience', protect, authorize('admin'), [
  body('hasVR').isBoolean().withMessage('hasVR must be a boolean'),
  body('vrLink').optional().isURL().withMessage('VR link must be a valid URL'),
  body('arLink').optional().isURL().withMessage('AR link must be a valid URL'),
  body('vrDescription').optional().isString().isLength({ max: 500 }).withMessage('VR description cannot exceed 500 characters')
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

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    destination.vrExperience = {
      hasVR: req.body.hasVR,
      vrLink: req.body.vrLink,
      arLink: req.body.arLink,
      vrDescription: req.body.vrDescription
    };

    await destination.save();

    res.status(200).json({
      status: 'success',
      message: 'VR/AR experience updated successfully',
      data: { vrExperience: destination.vrExperience }
    });
  } catch (error) {
    console.error('Update VR experience error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating VR experience'
    });
  }
});

// @desc    Get destinations with VR/AR experiences
// @route   GET /api/destinations/vr-enabled
// @access  Public
router.get('/vr-enabled', async (req, res) => {
  try {
    const destinations = await Destination.find({
      'vrExperience.hasVR': true,
      isActive: true
    })
    .select('name description images vrExperience location rating category')
    .sort({ 'rating.average': -1 })
    .limit(20);

    res.status(200).json({
      status: 'success',
      results: destinations.length,
      data: { destinations }
    });
  } catch (error) {
    console.error('Get VR destinations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching VR destinations'
    });
  }
});

// @desc    Get destination statistics
// @route   GET /api/destinations/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalDestinations = await Destination.countDocuments({ isActive: true });
    const vrDestinations = await Destination.countDocuments({ 
      'vrExperience.hasVR': true, 
      isActive: true 
    });
    
    const categoryStats = await Destination.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const topRatedDestinations = await Destination.find({ isActive: true })
      .sort({ 'rating.average': -1 })
      .limit(5)
      .select('name rating.average location.city images');

    const averageRating = await Destination.aggregate([
      { $match: { isActive: true, 'rating.count': { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalDestinations,
        vrDestinations,
        categoryStats,
        topRatedDestinations,
        averageRating: averageRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('Get destination stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching destination statistics'
    });
  }
});

// @desc    Add local provider to destination
// @route   POST /api/destinations/:id/providers
// @access  Private (Local Provider)
router.post('/:id/providers', protect, authorize('local_provider'), [
  body('services').isArray().withMessage('Services must be an array'),
  body('contact').optional().isString()
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

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    // Check if provider already exists for this destination
    const existingProvider = destination.localProviders.find(
      provider => provider.provider.toString() === req.user._id.toString()
    );

    if (existingProvider) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already registered as a provider for this destination'
      });
    }

    const providerData = {
      provider: req.user._id,
      services: req.body.services,
      contact: req.body.contact || req.user.phone
    };

    destination.localProviders.push(providerData);
    await destination.save();

    res.status(201).json({
      status: 'success',
      message: 'Successfully registered as local provider',
      data: { provider: providerData }
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding provider'
    });
  }
});

// @desc    Update review helpfulness
// @route   PUT /api/destinations/:id/reviews/:reviewId/helpful
// @access  Private
router.put('/:id/reviews/:reviewId/helpful', protect, async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    const review = destination.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    review.helpful += 1;
    await destination.save();

    res.status(200).json({
      status: 'success',
      message: 'Review marked as helpful',
      data: { helpful: review.helpful }
    });
  } catch (error) {
    console.error('Update review helpful error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating review'
    });
  }
});

module.exports = router;
