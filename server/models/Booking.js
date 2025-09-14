const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['product', 'event', 'homestay', 'tour', 'transport'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: function() {
      return this.bookingType === 'homestay' || this.bookingType === 'tour';
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'stripe', 'cash', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  contactInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  specialRequests: String,
  notes: String,
  cancellation: {
    requestedAt: Date,
    reason: String,
    refundEligible: {
      type: Boolean,
      default: true
    },
    refundAmount: Number,
    processedAt: Date
  },
  // For events
  eventDetails: {
    attendees: [{
      name: String,
      age: Number,
      contact: String
    }],
    dietaryRequirements: [String],
    accessibilityNeeds: [String]
  },
  // For homestays
  homestayDetails: {
    guests: [{
      name: String,
      age: Number,
      idProof: String
    }],
    checkInTime: String,
    checkOutTime: String,
    specialRequests: String
  },
  // For tours
  tourDetails: {
    participants: [{
      name: String,
      age: Number,
      emergencyContact: String
    }],
    pickupLocation: String,
    dropoffLocation: String,
    dietaryRequirements: [String],
    medicalConditions: [String]
  },
  // For transport
  transportDetails: {
    pickupTime: Date,
    pickupLocation: String,
    dropoffLocation: String,
    passengers: [{
      name: String,
      age: Number
    }],
    luggage: {
      count: Number,
      description: String
    }
  },
  reviews: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userComment: String,
    providerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    providerComment: String,
    reviewedAt: Date
  },
  communication: [{
    sender: {
      type: String,
      enum: ['user', 'provider', 'admin']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for user queries
bookingSchema.index({ user: 1, createdAt: -1 });

// Index for provider queries
bookingSchema.index({ provider: 1, createdAt: -1 });

// Index for status queries
bookingSchema.index({ status: 1, createdAt: -1 });

// Index for date range queries
bookingSchema.index({ startDate: 1, endDate: 1 });

// Virtual for booking duration
bookingSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 1;
});

// Virtual for booking status color
bookingSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
    completed: 'blue',
    refunded: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Method to calculate pricing
bookingSchema.methods.calculatePricing = function() {
  this.pricing.subtotal = this.pricing.basePrice * this.pricing.quantity;
  this.pricing.tax = Math.round(this.pricing.subtotal * 0.18); // 18% GST
  this.pricing.totalAmount = this.pricing.subtotal + this.pricing.tax - this.pricing.discount;
};

// Method to update status
bookingSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note: note,
    updatedBy: updatedBy
  });
};

// Method to add communication
bookingSchema.methods.addCommunication = function(sender, message, attachments = []) {
  this.communication.push({
    sender: sender,
    message: message,
    attachments: attachments
  });
};

// Pre-save middleware to calculate pricing
bookingSchema.pre('save', function(next) {
  if (this.isModified('pricing.basePrice') || this.isModified('pricing.quantity')) {
    this.calculatePricing();
  }
  next();
});

// Static method to get booking statistics
bookingSchema.statics.getBookingStats = async function(providerId, startDate, endDate) {
  const match = { provider: providerId };
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
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
