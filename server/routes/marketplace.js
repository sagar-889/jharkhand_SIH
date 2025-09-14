const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect, authorize, requireProviderVerification } = require('../middleware/auth');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Homestay = require('../models/Homestay');

const router = express.Router();

// @desc    Get all marketplace items
// @route   GET /api/marketplace
// @access  Public
router.get('/', [
  query('category').optional().isIn(['Handicrafts', 'Homestays', 'Events', 'Tours', 'Food', 'Transport']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('location').optional().isString()
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
      category,
      page = 1,
      limit = 20,
      search,
      minPrice,
      maxPrice,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) filter.$text = { $search: search };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('provider', 'firstName lastName businessDetails rating');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { products }
    });
  } catch (error) {
    console.error('Get marketplace items error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching marketplace items'
    });
  }
});

// @desc    Get single marketplace item
// @route   GET /api/marketplace/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('provider', 'firstName lastName businessDetails rating contact');

    if (!product || !product.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    console.error('Get marketplace item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching marketplace item'
    });
  }
});

// @desc    Create marketplace item
// @route   POST /api/marketplace
// @access  Private (Local providers only)
router.post('/', protect, authorize('local_provider'), requireProviderVerification, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['Handicrafts', 'Homestays', 'Events', 'Tours', 'Food', 'Transport']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('availability').isObject().withMessage('Availability information is required')
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

    const product = new Product({
      ...req.body,
      provider: req.user._id
    });

    await product.save();

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create marketplace item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating marketplace item'
    });
  }
});

// @desc    Update marketplace item
// @route   PUT /api/marketplace/:id
// @access  Private (Provider or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user is the provider or admin
    if (product.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this product'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Update marketplace item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating marketplace item'
    });
  }
});

// @desc    Delete marketplace item
// @route   DELETE /api/marketplace/:id
// @access  Private (Provider or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user is the provider or admin
    if (product.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete marketplace item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting marketplace item'
    });
  }
});

// @desc    Book marketplace item
// @route   POST /api/marketplace/:id/book
// @access  Private
router.post('/:id/book', protect, [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('specialRequests').optional().isString(),
  body('contactInfo').isObject().withMessage('Contact information is required')
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

    const product = await Product.findById(req.params.id);
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check availability
    if (!product.availability.isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not available for booking'
      });
    }

    const booking = new Booking({
      user: req.user._id,
      product: product._id,
      provider: product.provider,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      quantity: req.body.quantity,
      totalAmount: product.price * req.body.quantity,
      specialRequests: req.body.specialRequests,
      contactInfo: req.body.contactInfo,
      status: 'pending'
    });

    await booking.save();

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Book marketplace item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while booking marketplace item'
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/marketplace/bookings
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('product', 'title category price images')
      .populate('provider', 'firstName lastName businessDetails')
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
    console.error('Get bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching bookings'
    });
  }
});

// @desc    Update booking status
// @route   PUT /api/marketplace/bookings/:id/status
// @access  Private (Provider or Admin)
router.put('/bookings/:id/status', protect, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
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

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user is the provider or admin
    if (booking.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = req.body.status;
    booking.updatedAt = new Date();
    
    if (req.body.notes) {
      booking.notes = req.body.notes;
    }

    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating booking status'
    });
  }
});

// @desc    Get featured marketplace items
// @route   GET /api/marketplace/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ 
      featured: true, 
      isActive: true 
    })
    .sort({ 'rating.average': -1 })
    .limit(8)
    .populate('provider', 'firstName lastName businessDetails rating');

    res.status(200).json({
      status: 'success',
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching featured products'
    });
  }
});

// @desc    Get marketplace categories
// @route   GET /api/marketplace/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }},
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching categories'
    });
  }
});

// @desc    Add review to marketplace item
// @route   POST /api/marketplace/:id/reviews
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product'
      });
    }

    const review = {
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
      images: req.body.images || []
    };

    product.reviews.push(review);
    product.updateRating();
    await product.save();

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

// @desc    Add/Remove product from favorites
// @route   PUT /api/marketplace/:id/favorite
// @access  Private
router.put('/:id/favorite', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const isFavorited = product.favorites.includes(req.user._id);
    
    if (isFavorited) {
      // Remove from favorites
      product.favorites = product.favorites.filter(
        userId => userId.toString() !== req.user._id.toString()
      );
    } else {
      // Add to favorites
      product.favorites.push(req.user._id);
    }

    await product.save();

    res.status(200).json({
      status: 'success',
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      data: { isFavorited: !isFavorited }
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating favorites'
    });
  }
});

// @desc    Get user's favorite products
// @route   GET /api/marketplace/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({
      favorites: req.user._id,
      isActive: true
    })
    .populate('provider', 'firstName lastName businessDetails')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Product.countDocuments({
      favorites: req.user._id,
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      results: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { products }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching favorites'
    });
  }
});

// @desc    Search marketplace items
// @route   GET /api/marketplace/search
// @access  Public
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { q, page = 1, limit = 20, category, minPrice, maxPrice } = req.query;

    const filter = {
      $text: { $search: q },
      isActive: true
    };

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };

    const products = await Product.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('provider', 'firstName lastName businessDetails');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { products }
    });
  } catch (error) {
    console.error('Search marketplace error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while searching marketplace'
    });
  }
});

// @desc    Get marketplace statistics
// @route   GET /api/marketplace/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalProviders = await Product.distinct('provider', { isActive: true });
    
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgRating: { $avg: '$rating.average' }
      }},
      { $sort: { count: -1 } }
    ]);

    const topRatedProducts = await Product.find({ 
      isActive: true,
      'rating.count': { $gte: 5 }
    })
    .sort({ 'rating.average': -1 })
    .limit(5)
    .select('title category rating price images')
    .populate('provider', 'firstName lastName businessDetails');

    const recentProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title category price images createdAt')
      .populate('provider', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalProducts,
          totalProviders: totalProviders.length,
          categories: categoryStats.length
        },
        categoryBreakdown: categoryStats,
        topRated: topRatedProducts,
        recent: recentProducts
      }
    });
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching marketplace statistics'
    });
  }
});

// @desc    Get nearby marketplace items
// @route   GET /api/marketplace/nearby/:lat/:lng
// @access  Public
router.get('/nearby/:lat/:lng', [
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number'),
  query('category').optional().isIn(['Handicrafts', 'Homestays', 'Events', 'Tours', 'Food', 'Transport'])
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
    const { radius = 50, category, limit = 20 } = req.query;

    const filter = {
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
    };

    if (category) filter.category = category;

    const products = await Product.find(filter)
      .sort({ 'rating.average': -1 })
      .limit(parseInt(limit))
      .populate('provider', 'firstName lastName businessDetails');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: { products }
    });
  } catch (error) {
    console.error('Get nearby products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching nearby products'
    });
  }
});

// @desc    Update product view count
// @route   PUT /api/marketplace/:id/view
// @access  Public
router.put('/:id/view', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'View count updated'
    });
  } catch (error) {
    console.error('Update view count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating view count'
    });
  }
});

module.exports = router;
