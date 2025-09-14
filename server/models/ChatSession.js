
const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  sessionDuration: {
    type: Number,
    default: 0 // in minutes
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  // User preferences
  preferences: {
    interests: [String],
    budget: Number,
    accommodation: String,
    travelStyle: String
  },
  // Session metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String,
    os: String,
    referrer: String
  },
  // Analytics
  analytics: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    botMessages: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    intents: [String],
    entities: [String],
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      ratedAt: Date
    }
  },
  // Escalation
  escalation: {
    isEscalated: { type: Boolean, default: false },
    escalatedAt: Date,
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    resolution: String,
    resolvedAt: Date
  },
  // Tags for categorization
  tags: [String],
  // Notes for internal use
  notes: String,
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'escalated', 'resolved', 'abandoned'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for user queries
chatSessionSchema.index({ user: 1, createdAt: -1 });

// Index for active sessions
chatSessionSchema.index({ isActive: 1, lastActivity: -1 });

// Index for language queries
chatSessionSchema.index({ language: 1, createdAt: -1 });

// Index for analytics
chatSessionSchema.index({ 'analytics.totalMessages': -1 });

// Virtual for session duration in minutes
chatSessionSchema.virtual('durationMinutes').get(function() {
  if (this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / (1000 * 60));
  }
  return Math.round((new Date() - this.startedAt) / (1000 * 60));
});

// Virtual for session status
chatSessionSchema.virtual('sessionStatus').get(function() {
  if (this.endedAt) return 'ended';
  if (this.isActive) return 'active';
  return 'inactive';
});

// Method to update session activity
chatSessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.messageCount += 1;
  this.analytics.totalMessages += 1;
};

// Method to add intent to analytics
chatSessionSchema.methods.addIntent = function(intent) {
  if (!this.analytics.intents.includes(intent)) {
    this.analytics.intents.push(intent);
  }
};

// Method to add entity to analytics
chatSessionSchema.methods.addEntity = function(entity) {
  if (!this.analytics.entities.includes(entity)) {
    this.analytics.entities.push(entity);
  }
};

// Method to escalate session
chatSessionSchema.methods.escalate = function(reason, escalatedTo) {
  this.escalation.isEscalated = true;
  this.escalation.escalatedAt = new Date();
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.reason = reason;
  this.status = 'escalated';
};

// Method to resolve escalation
chatSessionSchema.methods.resolveEscalation = function(resolution) {
  this.escalation.resolution = resolution;
  this.escalation.resolvedAt = new Date();
  this.status = 'resolved';
};

// Method to end session
chatSessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endedAt = new Date();
  this.sessionDuration = this.durationMinutes;
  this.status = 'inactive';
};

// Method to rate session
chatSessionSchema.methods.rateSession = function(rating, feedback) {
  this.analytics.satisfaction.rating = rating;
  this.analytics.satisfaction.feedback = feedback;
  this.analytics.satisfaction.ratedAt = new Date();
};

// Pre-save middleware to update session duration
chatSessionSchema.pre('save', function(next) {
  if (this.isModified('endedAt') && this.endedAt) {
    this.sessionDuration = this.durationMinutes;
  }
  next();
});

// Static method to get session statistics
chatSessionSchema.statics.getSessionStats = async function(startDate, endDate) {
  const match = {};
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
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        averageDuration: { $avg: '$sessionDuration' },
        totalMessages: { $sum: '$analytics.totalMessages' },
        averageMessages: { $avg: '$analytics.totalMessages' },
        escalatedSessions: {
          $sum: { $cond: [{ $eq: ['$escalation.isEscalated', true] }, 1, 0] }
        },
        averageSatisfaction: { $avg: '$analytics.satisfaction.rating' }
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    activeSessions: 0,
    averageDuration: 0,
    totalMessages: 0,
    averageMessages: 0,
    escalatedSessions: 0,
    averageSatisfaction: 0
  };
};

// Static method to get popular intents
chatSessionSchema.statics.getPopularIntents = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const intents = await this.aggregate([
    { $match: match },
    { $unwind: '$analytics.intents' },
    {
      $group: {
        _id: '$analytics.intents',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return intents;
};

// Static method to get language distribution
chatSessionSchema.statics.getLanguageDistribution = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const languages = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return languages;
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
