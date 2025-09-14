const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');
const Stripe = require('stripe');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const router = express.Router();

// Initialize payment gateways
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('paymentMethod').isIn(['razorpay', 'stripe']).withMessage('Invalid payment method')
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

    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or already processed'
      });
    }

    if (paymentMethod === 'razorpay') {
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: booking.pricing.totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `booking_${booking._id}`,
        notes: {
          bookingId: booking._id.toString(),
          userId: req.user._id.toString()
        }
      });

      // Save payment record
      const payment = new Payment({
        user: req.user._id,
        booking: booking._id,
        amount: booking.pricing.totalAmount,
        currency: 'INR',
        method: 'razorpay',
        orderId: razorpayOrder.id,
        status: 'pending'
      });

      await payment.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment intent created successfully',
        data: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    } else if (paymentMethod === 'stripe') {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: booking.pricing.totalAmount * 100, // Convert to cents
        currency: 'inr',
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user._id.toString()
        }
      });

      // Save payment record
      const payment = new Payment({
        user: req.user._id,
        booking: booking._id,
        amount: booking.pricing.totalAmount,
        currency: 'INR',
        method: 'stripe',
        paymentIntentId: paymentIntent.id,
        status: 'pending'
      });

      await payment.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment intent created successfully',
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating payment intent'
    });
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-razorpay
// @access  Private
router.post('/verify-razorpay', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required')
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

    const { orderId, paymentId, signature } = req.body;

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not captured'
      });
    }

    // Update payment record
    const paymentRecord = await Payment.findOneAndUpdate(
      { orderId: orderId, user: req.user._id },
      {
        paymentId: paymentId,
        status: 'completed',
        paidAt: new Date(),
        razorpayPaymentId: paymentId
      },
      { new: true }
    );

    if (!paymentRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment record not found'
      });
    }

    // Update booking status
    await Booking.findByIdAndUpdate(paymentRecord.booking, {
      status: 'confirmed',
      'payment.status': 'completed',
      'payment.paymentId': paymentId,
      'payment.paidAt': new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: { payment: paymentRecord }
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying payment'
    });
  }
});

// @desc    Verify Stripe payment
// @route   POST /api/payments/verify-stripe
// @access  Private
router.post('/verify-stripe', protect, [
  body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required')
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

    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not successful'
      });
    }

    // Update payment record
    const paymentRecord = await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntentId, user: req.user._id },
      {
        status: 'completed',
        paidAt: new Date(),
        stripePaymentId: paymentIntent.id
      },
      { new: true }
    );

    if (!paymentRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment record not found'
      });
    }

    // Update booking status
    await Booking.findByIdAndUpdate(paymentRecord.booking, {
      status: 'confirmed',
      'payment.status': 'completed',
      'payment.paymentId': paymentIntent.id,
      'payment.paidAt': new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: { payment: paymentRecord }
    });
  } catch (error) {
    console.error('Verify Stripe payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying payment'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('booking', 'product startDate endDate quantity')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { payments }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching payment history'
    });
  }
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
router.post('/refund', protect, [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  body('reason').notEmpty().withMessage('Refund reason is required')
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

    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      user: req.user._id,
      status: 'completed'
    });

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found or not eligible for refund'
      });
    }

    const refundAmount = amount || payment.amount;

    if (payment.method === 'razorpay') {
      // Process Razorpay refund
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundAmount * 100, // Convert to paise
        notes: {
          reason: reason,
          bookingId: payment.booking.toString()
        }
      });

      // Update payment record
      payment.refundId = refund.id;
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      payment.status = 'refunded';
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(payment.booking, {
        status: 'cancelled',
        'payment.status': 'refunded',
        'payment.refundedAt': new Date(),
        'payment.refundAmount': refundAmount
      });

      res.status(200).json({
        status: 'success',
        message: 'Refund processed successfully',
        data: { refund }
      });
    } else if (payment.method === 'stripe') {
      // Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        amount: refundAmount * 100, // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          reason: reason,
          bookingId: payment.booking.toString()
        }
      });

      // Update payment record
      payment.refundId = refund.id;
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      payment.status = 'refunded';
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(payment.booking, {
        status: 'cancelled',
        'payment.status': 'refunded',
        'payment.refundedAt': new Date(),
        'payment.refundAmount': refundAmount
      });

      res.status(200).json({
        status: 'success',
        message: 'Refund processed successfully',
        data: { refund }
      });
    }
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while processing refund'
    });
  }
});

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Public
router.get('/methods', async (req, res) => {
  try {
    const methods = [
      {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Pay with UPI, Cards, Net Banking, Wallets',
        icon: '💳',
        supportedCurrencies: ['INR'],
        features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI']
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pay with Cards and Digital Wallets',
        icon: '💎',
        supportedCurrencies: ['INR', 'USD'],
        features: ['Cards', 'Apple Pay', 'Google Pay', 'UPI']
      }
    ];

    res.status(200).json({
      status: 'success',
      data: { methods }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching payment methods'
    });
  }
});

// @desc    Webhook for Razorpay
// @route   POST /api/payments/webhook/razorpay
// @access  Public
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        // Handle failed payment
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
      default:
        console.log('Unhandled event:', event.event);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ status: 'error' });
  }
});

// @desc    Webhook for Stripe
// @route   POST /api/payments/webhook/stripe
// @access  Public
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;
      default:
        console.log('Unhandled event:', event.type);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ status: 'error' });
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Payment.getPaymentStats(req.user._id, startDate, endDate);
    
    // Get monthly breakdown
    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          user: req.user._id,
          ...(startDate && endDate && {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          })
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get payment method breakdown
    const methodStats = await Payment.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats,
        monthlyBreakdown: monthlyStats,
        paymentMethods: methodStats
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching payment statistics'
    });
  }
});

// @desc    Get payment receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('booking')
    .populate('user', 'firstName lastName email phone');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    const receipt = {
      receiptNumber: `JT-${payment._id.toString().slice(-8).toUpperCase()}`,
      paymentId: payment._id,
      transactionId: payment.transactionId || payment.paymentId,
      date: payment.paidAt || payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      booking: payment.booking,
      user: payment.user,
      fees: payment.fees,
      netAmount: payment.amount - payment.fees.totalFees
    };

    res.status(200).json({
      status: 'success',
      data: { receipt }
    });
  } catch (error) {
    console.error('Get payment receipt error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating receipt'
    });
  }
});

// @desc    Cancel pending payment
// @route   PUT /api/payments/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found or cannot be cancelled'
      });
    }

    payment.updateStatus('cancelled');
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, {
      status: 'cancelled',
      'payment.status': 'cancelled'
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment cancelled successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while cancelling payment'
    });
  }
});

// @desc    Retry failed payment
// @route   POST /api/payments/:id/retry
// @access  Private
router.post('/:id/retry', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'failed'
    }).populate('booking');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found or cannot be retried'
      });
    }

    // Check retry limit
    if (payment.error.retryCount >= 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum retry attempts exceeded'
      });
    }

    // Create new payment intent
    if (payment.method === 'razorpay') {
      const razorpayOrder = await razorpay.orders.create({
        amount: payment.amount * 100,
        currency: 'INR',
        receipt: `retry_${payment._id}`,
        notes: {
          originalPaymentId: payment._id.toString(),
          retryAttempt: payment.error.retryCount + 1
        }
      });

      payment.orderId = razorpayOrder.id;
      payment.status = 'pending';
      payment.error.retryCount += 1;
      await payment.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment retry initiated',
        data: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    } else if (payment.method === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount * 100,
        currency: 'inr',
        metadata: {
          originalPaymentId: payment._id.toString(),
          retryAttempt: payment.error.retryCount + 1
        }
      });

      payment.paymentIntentId = paymentIntent.id;
      payment.status = 'pending';
      payment.error.retryCount += 1;
      await payment.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment retry initiated',
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    }
  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while retrying payment'
    });
  }
});

module.exports = router;
