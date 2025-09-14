const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'bot', 'admin']
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']
  },
  // AI Analysis
  intent: {
    type: String,
    enum: ['greeting', 'destination_info', 'itinerary_planning', 'booking', 'weather', 'transport', 'food', 'accommodation', 'events', 'emergency', 'complaint', 'feedback', 'goodbye', 'other']
  },
  entities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  // Response data
  suggestions: [String],
  quickReplies: [String],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'location', 'contact', 'destination_card', 'product_card', 'booking_card']
    },
    url: String,
    caption: String,
    data: mongoose.Schema.Types.Mixed
  }],
  // User interaction
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isHelpful: {
    type: Boolean,
    default: null
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  // Response time
  responseTime: {
    type: Number,
    default: 0 // in milliseconds
  },
  // Message metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String,
    os: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
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
  // Follow-up
  followUp: {
    isRequired: { type: Boolean, default: false },
    scheduledFor: Date,
    message: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  },
  // Sentiment analysis
  sentiment: {
    score: { type: Number, min: -1, max: 1 },
    magnitude: { type: Number, min: 0, max: 1 },
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed']
    }
  },
  // Translation
  translation: {
    originalLanguage: String,
    translatedText: String,
    translatedLanguage: String,
    translatedAt: Date
  },
  // Voice message
  voice: {
    audioUrl: String,
    duration: Number, // in seconds
    transcription: String,
    language: String
  },
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
    default: 'sent'
  },
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  },
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

// Index for session queries
chatMessageSchema.index({ session: 1, timestamp: 1 });

// Index for user queries
chatMessageSchema.index({ user: 1, timestamp: -1 });

// Index for intent analysis
chatMessageSchema.index({ intent: 1, timestamp: -1 });

// Index for sentiment analysis
chatMessageSchema.index({ 'sentiment.label': 1, timestamp: -1 });

// Index for escalation
chatMessageSchema.index({ 'escalation.isEscalated': 1, timestamp: -1 });

// Virtual for message age in minutes
chatMessageSchema.virtual('ageMinutes').get(function() {
  return Math.round((new Date() - this.timestamp) / (1000 * 60));
});

// Virtual for message type
chatMessageSchema.virtual('messageType').get(function() {
  if (this.attachments && this.attachments.length > 0) {
    return 'media';
  }
  if (this.voice && this.voice.audioUrl) {
    return 'voice';
  }
  return 'text';
});

// Method to mark as read
chatMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
};

// Method to mark as helpful
chatMessageSchema.methods.markAsHelpful = function() {
  this.isHelpful = true;
  this.helpfulCount += 1;
};

// Method to mark as not helpful
chatMessageSchema.methods.markAsNotHelpful = function() {
  this.isHelpful = false;
  this.helpfulCount = Math.max(0, this.helpfulCount - 1);
};

// Method to escalate message
chatMessageSchema.methods.escalate = function(reason, escalatedTo) {
  this.escalation.isEscalated = true;
  this.escalation.escalatedAt = new Date();
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.reason = reason;
};

// Method to resolve escalation
chatMessageSchema.methods.resolveEscalation = function(resolution) {
  this.escalation.resolution = resolution;
  this.escalation.resolvedAt = new Date();
};

// Method to add translation
chatMessageSchema.methods.addTranslation = function(originalLanguage, translatedText, translatedLanguage) {
  this.translation.originalLanguage = originalLanguage;
  this.translation.translatedText = translatedText;
  this.translation.translatedLanguage = translatedLanguage;
  this.translation.translatedAt = new Date();
};

// Method to add voice data
chatMessageSchema.methods.addVoiceData = function(audioUrl, duration, transcription, language) {
  this.voice.audioUrl = audioUrl;
  this.voice.duration = duration;
  this.voice.transcription = transcription;
  this.voice.language = language;
};

// Method to add sentiment analysis
chatMessageSchema.methods.addSentimentAnalysis = function(score, magnitude, label) {
  this.sentiment.score = score;
  this.sentiment.magnitude = magnitude;
  this.sentiment.label = label;
};

// Method to schedule follow-up
chatMessageSchema.methods.scheduleFollowUp = function(scheduledFor, message) {
  this.followUp.isRequired = true;
  this.followUp.scheduledFor = scheduledFor;
  this.followUp.message = message;
  this.followUp.status = 'pending';
};

// Static method to get message statistics
chatMessageSchema.statics.getMessageStats = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ['$sender', 'user'] }, 1, 0] }
        },
        botMessages: {
          $sum: { $cond: [{ $eq: ['$sender', 'bot'] }, 1, 0] }
        },
        averageResponseTime: { $avg: '$responseTime' },
        helpfulMessages: {
          $sum: { $cond: [{ $eq: ['$isHelpful', true] }, 1, 0] }
        },
        escalatedMessages: {
          $sum: { $cond: [{ $eq: ['$escalation.isEscalated', true] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalMessages: 0,
    userMessages: 0,
    botMessages: 0,
    averageResponseTime: 0,
    helpfulMessages: 0,
    escalatedMessages: 0
  };
};

// Static method to get popular intents
chatMessageSchema.statics.getPopularIntents = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const intents = await this.aggregate([
    { $match: { ...match, intent: { $exists: true } } },
    {
      $group: {
        _id: '$intent',
        count: { $sum: 1 },
        averageConfidence: { $avg: '$confidence' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return intents;
};

// Static method to get sentiment distribution
chatMessageSchema.statics.getSentimentDistribution = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const sentiments = await this.aggregate([
    { $match: { ...match, 'sentiment.label': { $exists: true } } },
    {
      $group: {
        _id: '$sentiment.label',
        count: { $sum: 1 },
        averageScore: { $avg: '$sentiment.score' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return sentiments;
};

// Pre-save middleware to update timestamp
chatMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

