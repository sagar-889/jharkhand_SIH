const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  method: {
    type: String,
    required: true,
    enum: ['razorpay', 'stripe', 'cash', 'bank_transfer']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Razorpay fields
  orderId: String,
  paymentId: String,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String,
  // Stripe fields
  paymentIntentId: String,
  stripePaymentId: String,
  clientSecret: String,
  // Common fields
  transactionId: String,
  gatewayTransactionId: String,
  paidAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  // Refund fields
  refundId: String,
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed']
  },
  // Payment details
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    paymentMethod: String,
    bankName: String,
    upiId: String,
    walletName: String
  },
  // Fees and charges
  fees: {
    gatewayFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String,
    os: String
  },
  // Error handling
  error: {
    code: String,
    message: String,
    gatewayError: String,
    retryCount: {
      type: Number,
      default: 0
    }
  },
  // Webhook data
  webhookData: {
    receivedAt: Date,
    processedAt: Date,
    rawData: mongoose.Schema.Types.Mixed
  },
  // Settlement
  settlement: {
    status: {
      type: String,
      enum: ['pending', 'settled', 'failed'],
      default: 'pending'
    },
    settledAt: Date,
    settlementId: String,
    netAmount: Number
  },
  // Compliance
  compliance: {
    kycVerified: {
      type: Boolean,
      default: false
    },
    amlChecked: {
      type: Boolean,
      default: false
    },
    riskScore: Number
  },
  // Notes and comments
  notes: String,
  internalNotes: String,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for user queries
paymentSchema.index({ user: 1, createdAt: -1 });

// Index for booking queries
paymentSchema.index({ booking: 1 });

// Index for status queries
paymentSchema.index({ status: 1, createdAt: -1 });

// Index for gateway queries
paymentSchema.index({ method: 1, status: 1 });

// Index for transaction lookups
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });

// Virtual for payment status color
paymentSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'yellow',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
    refunded: 'blue'
  };
  return colors[this.status] || 'gray';
});

// Virtual for net amount after fees
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.fees.totalFees;
});

// Method to calculate fees
paymentSchema.methods.calculateFees = function() {
  let gatewayFee = 0;
  let processingFee = 0;
  
  if (this.method === 'razorpay') {
    // Razorpay charges 2% + GST
    gatewayFee = this.amount * 0.02;
    processingFee = gatewayFee * 0.18; // 18% GST
  } else if (this.method === 'stripe') {
    // Stripe charges 2.9% + ₹2 + GST
    gatewayFee = (this.amount * 0.029) + 2;
    processingFee = gatewayFee * 0.18; // 18% GST
  }
  
  this.fees.gatewayFee = Math.round(gatewayFee * 100) / 100;
  this.fees.processingFee = Math.round(processingFee * 100) / 100;
  this.fees.tax = this.fees.processingFee;
  this.fees.totalFees = this.fees.gatewayFee + this.fees.processingFee;
};

// Method to update status
paymentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  switch (newStatus) {
    case 'completed':
      this.paidAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
    case 'refunded':
      this.refundedAt = new Date();
      break;
  }
  
  // Update additional data
  Object.assign(this, additionalData);
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  this.status = 'refunded';
  this.updatedAt = new Date();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(userId, startDate, endDate) {
  const match = { user: userId };
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        netAmount: { $sum: { $subtract: ['$amount', '$fees.totalFees'] } },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalFees: 0,
    netAmount: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    averageAmount: 0
  };
};

// Pre-save middleware to calculate fees
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('method')) {
    this.calculateFees();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
