const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Itinerary = require('../models/Itinerary');
const { POI, TrafficUpdate } = require('../models/Map');
const { analyzeUserSentiment, generateInsights } = require('../services/analyticsService');

const router = express.Router();

// All admin routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard overview statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const activeUsersThisWeek = await User.countDocuments({ lastLogin: { $gte: lastWeek } });

    // Destination statistics
    const totalDestinations = await Destination.countDocuments();
    const verifiedDestinations = await Destination.countDocuments({ verified: true });
    const destinationsWithVR = await Destination.countDocuments({ 'vrExperience.vrLink': { $exists: true, $ne: '' } });

    // Booking statistics
    const totalBookings = await Booking.countDocuments();
    const bookingsThisMonth = await Booking.countDocuments({ createdAt: { $gte: lastMonth } });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Revenue statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: lastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Marketplace statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const pendingProducts = await Product.countDocuments({ status: 'pending' });

    // Itinerary statistics
    const totalItineraries = await Itinerary.countDocuments();
    const itinerariesThisMonth = await Itinerary.countDocuments({ createdAt: { $gte: lastMonth } });

    const dashboardStats = {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisWeek: activeUsersThisWeek,
        growthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) : 0
      },
      destinations: {
        total: totalDestinations,
        verified: verifiedDestinations,
        withVR: destinationsWithVR,
        verificationRate: totalDestinations > 0 ? ((verifiedDestinations / totalDestinations) * 100).toFixed(2) : 0
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        completed: completedBookings,
        cancelled: cancelledBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(2) : 0
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: monthlyRevenue[0]?.total || 0,
        averagePerBooking: completedBookings > 0 ? ((totalRevenue[0]?.total || 0) / completedBookings).toFixed(2) : 0
      },
      marketplace: {
        total: totalProducts,
        active: activeProducts,
        pending: pendingProducts,
        approvalRate: totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(2) : 0
      },
      itineraries: {
        total: totalItineraries,
        thisMonth: itinerariesThisMonth,
        averagePerUser: totalUsers > 0 ? (totalItineraries / totalUsers).toFixed(2) : 0
      }
    };

    res.status(200).json({
      status: 'success',
      data: { dashboard: dashboardStats }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @desc    Get user analytics and trends
// @route   GET /api/admin/analytics/users
// @access  Private (Admin only)
router.get('/analytics/users', async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    let dateRange;
    let groupFormat;
    
    switch (period) {
      case '7d':
        dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case '30d':
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case '12m':
        dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    // User registration trends
    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          tourists: { $sum: { $cond: [{ $eq: ['$role', 'tourist'] }, 1, 0] } },
          providers: { $sum: { $cond: [{ $eq: ['$role', 'local_provider'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User demographics
    const demographics = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    // User activity patterns
    const activityPatterns = await User.aggregate([
      { $match: { lastLogin: { $exists: true } } },
      {
        $group: {
          _id: { $dayOfWeek: '$lastLogin' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top user locations
    const topLocations = await User.aggregate([
      { $match: { 'profile.location.city': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$profile.location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        registrationTrends,
        demographics,
        activityPatterns,
        topLocations
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user analytics'
    });
  }
});

// @desc    Get booking analytics and trends
// @route   GET /api/admin/analytics/bookings
// @access  Private (Admin only)
router.get('/analytics/bookings', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateRange;
    switch (period) {
      case '7d':
        dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Booking trends over time
    const bookingTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          avgAmount: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Booking by type
    const bookingsByType = await Booking.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Booking status distribution
    const statusDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular destinations/products
    const popularItems = await Booking.aggregate([
      { $match: { item: { $exists: true } } },
      {
        $lookup: {
          from: 'destinations',
          localField: 'item',
          foreignField: '_id',
          as: 'destination'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'item',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $group: {
          _id: '$item',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          name: { $first: { $ifNull: [{ $arrayElemAt: ['$destination.name', 0] }, { $arrayElemAt: ['$product.name', 0] }] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Seasonal patterns
    const seasonalPatterns = await Booking.aggregate([
      {
        $group: {
          _id: { $month: '$travelDate' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        bookingTrends,
        bookingsByType,
        statusDistribution,
        popularItems,
        seasonalPatterns
      }
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching booking analytics'
    });
  }
});

// @desc    Get revenue analytics and financial insights
// @route   GET /api/admin/analytics/revenue
// @access  Private (Admin only)
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateRange;
    switch (period) {
      case '7d':
        dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue trends
    const revenueTrends = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          fees: { $sum: '$platformFee' },
          refunds: { $sum: { $cond: ['$refund.amount', '$refund.amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: '$method',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Revenue by gateway
    const revenueByGateway = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: '$gateway',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          fees: { $sum: '$platformFee' }
        }
      }
    ]);

    // Failed payments analysis
    const failedPayments = await Payment.aggregate([
      { $match: { status: 'failed', createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: '$failureReason',
          count: { $sum: 1 },
          lostRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top revenue generators
    const topRevenueUsers = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$user',
          totalRevenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        revenueTrends,
        revenueByMethod,
        revenueByGateway,
        failedPayments,
        topRevenueUsers
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching revenue analytics'
    });
  }
});

// @desc    Get content analytics (destinations, products, etc.)
// @route   GET /api/admin/analytics/content
// @access  Private (Admin only)
router.get('/analytics/content', async (req, res) => {
  try {
    // Destination analytics
    const destinationStats = await Destination.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
          totalViews: { $sum: '$views' },
          verified: { $sum: { $cond: ['$verified', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top rated destinations
    const topDestinations = await Destination.find()
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(10)
      .select('name category rating views location');

    // Product analytics
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
          avgPrice: { $avg: '$pricing.basePrice' },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Content engagement metrics
    const engagementMetrics = await Destination.aggregate([
      {
        $project: {
          name: 1,
          views: 1,
          rating: 1,
          reviewCount: '$rating.count',
          engagementScore: {
            $add: [
              { $multiply: ['$views', 0.1] },
              { $multiply: ['$rating.count', 2] },
              { $multiply: ['$rating.average', 10] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 20 }
    ]);

    // VR/AR adoption
    const vrStats = await Destination.aggregate([
      {
        $group: {
          _id: null,
          totalDestinations: { $sum: 1 },
          withVR: { $sum: { $cond: [{ $ne: ['$vrExperience.vrLink', ''] }, 1, 0] } },
          withAR: { $sum: { $cond: [{ $ne: ['$vrExperience.arLink', ''] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        destinationStats,
        topDestinations,
        productStats,
        engagementMetrics,
        vrAdoption: vrStats[0] || { totalDestinations: 0, withVR: 0, withAR: 0 }
      }
    });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching content analytics'
    });
  }
});

// @desc    Get user sentiment analysis
// @route   GET /api/admin/analytics/sentiment
// @access  Private (Admin only)
router.get('/analytics/sentiment', async (req, res) => {
  try {
    // Get recent reviews and feedback
    const recentReviews = await Destination.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.createdAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $project: {
          destinationName: '$name',
          review: '$reviews.comment',
          rating: '$reviews.rating',
          createdAt: '$reviews.createdAt'
        }
      },
      { $limit: 100 }
    ]);

    // Analyze sentiment using AI service
    const sentimentAnalysis = await analyzeUserSentiment(recentReviews);

    // Get rating distribution
    const ratingDistribution = await Destination.aggregate([
      { $unwind: '$reviews' },
      {
        $group: {
          _id: '$reviews.rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Common issues and complaints
    const commonIssues = await generateInsights(recentReviews);

    res.status(200).json({
      status: 'success',
      data: {
        sentimentAnalysis,
        ratingDistribution,
        commonIssues,
        totalReviews: recentReviews.length
      }
    });
  } catch (error) {
    console.error('Get sentiment analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while performing sentiment analysis'
    });
  }
});

// @desc    Get system health and performance metrics
// @route   GET /api/admin/system/health
// @access  Private (Admin only)
router.get('/system/health', async (req, res) => {
  try {
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.version,
      database: {
        status: 'connected',
        collections: {}
      }
    };

    // Database collection stats
    const collections = ['users', 'destinations', 'products', 'bookings', 'payments', 'itineraries'];
    for (const collection of collections) {
      try {
        const count = await eval(`${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}.countDocuments()`);
        systemHealth.database.collections[collection] = { count };
      } catch (error) {
        systemHealth.database.collections[collection] = { error: error.message };
      }
    }

    res.status(200).json({
      status: 'success',
      data: { systemHealth }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while checking system health'
    });
  }
});

// @desc    Manage users (approve, suspend, delete)
// @route   PUT /api/admin/users/:id/action
// @access  Private (Admin only)
router.put('/users/:id/action', [
  body('action').isIn(['approve', 'suspend', 'activate', 'delete']).withMessage('Invalid action'),
  body('reason').optional().isString()
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

    const { action, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    switch (action) {
      case 'approve':
        user.isVerified = true;
        user.status = 'active';
        break;
      case 'suspend':
        user.status = 'suspended';
        user.suspensionReason = reason;
        user.suspendedAt = new Date();
        break;
      case 'activate':
        user.status = 'active';
        user.suspensionReason = undefined;
        user.suspendedAt = undefined;
        break;
      case 'delete':
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          status: 'success',
          message: 'User deleted successfully'
        });
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${action}d successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('User action error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while performing user action'
    });
  }
});

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Manage destinations (approve, feature, delete)
// @route   PUT /api/admin/destinations/:id/action
// @access  Private (Admin only)
router.put('/destinations/:id/action', [
  body('action').isIn(['approve', 'reject', 'feature', 'unfeature', 'delete']).withMessage('Invalid action'),
  body('reason').optional().isString()
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

    const { action, reason } = req.body;
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination not found'
      });
    }

    switch (action) {
      case 'approve':
        destination.verified = true;
        destination.status = 'active';
        break;
      case 'reject':
        destination.verified = false;
        destination.status = 'rejected';
        destination.rejectionReason = reason;
        break;
      case 'feature':
        destination.featured = true;
        destination.featuredAt = new Date();
        break;
      case 'unfeature':
        destination.featured = false;
        destination.featuredAt = undefined;
        break;
      case 'delete':
        await Destination.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          status: 'success',
          message: 'Destination deleted successfully'
        });
    }

    await destination.save();

    res.status(200).json({
      status: 'success',
      message: `Destination ${action}d successfully`,
      data: { destination }
    });
  } catch (error) {
    console.error('Destination action error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while performing destination action'
    });
  }
});

// @desc    Manage marketplace products
// @route   PUT /api/admin/products/:id/action
// @access  Private (Admin only)
router.put('/products/:id/action', [
  body('action').isIn(['approve', 'reject', 'feature', 'unfeature', 'delete']).withMessage('Invalid action'),
  body('reason').optional().isString()
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

    const { action, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    switch (action) {
      case 'approve':
        product.status = 'active';
        product.approvedAt = new Date();
        break;
      case 'reject':
        product.status = 'rejected';
        product.rejectionReason = reason;
        break;
      case 'feature':
        product.featured = true;
        product.featuredAt = new Date();
        break;
      case 'unfeature':
        product.featured = false;
        product.featuredAt = undefined;
        break;
      case 'delete':
        await Product.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          status: 'success',
          message: 'Product deleted successfully'
        });
    }

    await product.save();

    res.status(200).json({
      status: 'success',
      message: `Product ${action}d successfully`,
      data: { product }
    });
  } catch (error) {
    console.error('Product action error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while performing product action'
    });
  }
});

// @desc    Get pending approvals
// @route   GET /api/admin/pending
// @access  Private (Admin only)
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await User.find({ isVerified: false })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingDestinations = await Destination.find({ verified: false })
      .populate('addedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingProducts = await Product.find({ status: 'pending' })
      .populate('provider', 'businessName email')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingPOIs = await POI.find({ verified: false })
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        users: pendingUsers,
        destinations: pendingDestinations,
        products: pendingProducts,
        pois: pendingPOIs
      }
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching pending approvals'
    });
  }
});

// @desc    Generate and export reports
// @route   POST /api/admin/reports/generate
// @access  Private (Admin only)
router.post('/reports/generate', [
  body('type').isIn(['users', 'bookings', 'revenue', 'destinations', 'comprehensive']).withMessage('Invalid report type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format')
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

    const { type, startDate, endDate, format = 'json' } = req.body;
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    let reportData = {};

    switch (type) {
      case 'users':
        reportData = await generateUserReport(dateFilter);
        break;
      case 'bookings':
        reportData = await generateBookingReport(dateFilter);
        break;
      case 'revenue':
        reportData = await generateRevenueReport(dateFilter);
        break;
      case 'destinations':
        reportData = await generateDestinationReport(dateFilter);
        break;
      case 'comprehensive':
        reportData = await generateComprehensiveReport(dateFilter);
        break;
    }

    const report = {
      type,
      period: { startDate, endDate },
      generatedAt: new Date(),
      generatedBy: req.user._id,
      data: reportData
    };

    res.status(200).json({
      status: 'success',
      message: 'Report generated successfully',
      data: { report }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating report'
    });
  }
});

// Helper functions for report generation
const generateUserReport = async (dateFilter) => {
  const users = await User.find(dateFilter).select('-password -refreshToken');
  const summary = {
    totalUsers: users.length,
    byRole: {},
    byStatus: {},
    verificationRate: 0
  };

  users.forEach(user => {
    summary.byRole[user.role] = (summary.byRole[user.role] || 0) + 1;
    summary.byStatus[user.status || 'active'] = (summary.byStatus[user.status || 'active'] || 0) + 1;
  });

  const verified = users.filter(u => u.isVerified).length;
  summary.verificationRate = users.length > 0 ? ((verified / users.length) * 100).toFixed(2) : 0;

  return { summary, users };
};

const generateBookingReport = async (dateFilter) => {
  const bookings = await Booking.find(dateFilter)
    .populate('user', 'firstName lastName email')
    .populate('item');

  const summary = {
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    byType: {},
    byStatus: {},
    avgBookingValue: 0
  };

  bookings.forEach(booking => {
    summary.byType[booking.type] = (summary.byType[booking.type] || 0) + 1;
    summary.byStatus[booking.status] = (summary.byStatus[booking.status] || 0) + 1;
  });

  summary.avgBookingValue = bookings.length > 0 ? (summary.totalRevenue / bookings.length).toFixed(2) : 0;

  return { summary, bookings };
};

const generateRevenueReport = async (dateFilter) => {
  const payments = await Payment.find({ ...dateFilter, status: 'completed' });
  
  const summary = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: payments.length,
    totalFees: payments.reduce((sum, p) => sum + (p.platformFee || 0), 0),
    byGateway: {},
    byMethod: {},
    avgTransactionValue: 0
  };

  payments.forEach(payment => {
    summary.byGateway[payment.gateway] = (summary.byGateway[payment.gateway] || 0) + payment.amount;
    summary.byMethod[payment.method] = (summary.byMethod[payment.method] || 0) + payment.amount;
  });

  summary.avgTransactionValue = payments.length > 0 ? (summary.totalRevenue / payments.length).toFixed(2) : 0;

  return { summary, payments };
};

const generateDestinationReport = async (dateFilter) => {
  const destinations = await Destination.find(dateFilter);
  
  const summary = {
    totalDestinations: destinations.length,
    verified: destinations.filter(d => d.verified).length,
    featured: destinations.filter(d => d.featured).length,
    byCategory: {},
    avgRating: 0,
    totalViews: destinations.reduce((sum, d) => sum + (d.views || 0), 0)
  };

  destinations.forEach(dest => {
    summary.byCategory[dest.category] = (summary.byCategory[dest.category] || 0) + 1;
  });

  const ratedDestinations = destinations.filter(d => d.rating && d.rating.average > 0);
  summary.avgRating = ratedDestinations.length > 0 ? 
    (ratedDestinations.reduce((sum, d) => sum + d.rating.average, 0) / ratedDestinations.length).toFixed(2) : 0;

  return { summary, destinations };
};

const generateComprehensiveReport = async (dateFilter) => {
  const [userReport, bookingReport, revenueReport, destinationReport] = await Promise.all([
    generateUserReport(dateFilter),
    generateBookingReport(dateFilter),
    generateRevenueReport(dateFilter),
    generateDestinationReport(dateFilter)
  ]);

  return {
    users: userReport.summary,
    bookings: bookingReport.summary,
    revenue: revenueReport.summary,
    destinations: destinationReport.summary,
    overview: {
      totalUsers: userReport.summary.totalUsers,
      totalBookings: bookingReport.summary.totalBookings,
      totalRevenue: revenueReport.summary.totalRevenue,
      totalDestinations: destinationReport.summary.totalDestinations
    }
  };
};

module.exports = router;
