 const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, optionalAuth } = require('../middleware/auth');
const { processChatMessage } = require('../services/chatbotService');
const { translateText } = require('../services/translationService');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// @desc    Start new chat session
// @route   POST /api/chatbot/start-session
// @access  Private (Optional)
router.post('/start-session', optionalAuth, [
  body('language').optional().isIn(['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']).withMessage('Invalid language code'),
  body('context').optional().isObject().withMessage('Context must be an object')
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

    const { language = 'en', context = {} } = req.body;

    const session = new ChatSession({
      user: req.user ? req.user._id : null,
      language: language,
      context: context,
      isActive: true
    });

    await session.save();

    // Send welcome message
    const welcomeMessage = await processChatMessage({
      message: 'Hello',
      sessionId: session._id,
      language: language,
      context: context
    });

    res.status(201).json({
      status: 'success',
      message: 'Chat session started successfully',
      data: {
        sessionId: session._id,
        language: language,
        welcomeMessage: welcomeMessage
      }
    });
  } catch (error) {
    console.error('Start chat session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while starting chat session'
    });
  }
});

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private (Optional)
router.post('/message', optionalAuth, [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('sessionId').isMongoId().withMessage('Valid session ID is required'),
  body('language').optional().isIn(['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']).withMessage('Invalid language code')
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

    const { message, sessionId, language = 'en' } = req.body;

    // Get or create session
    let session = await ChatSession.findById(sessionId);
    if (!session) {
      session = new ChatSession({
        user: req.user ? req.user._id : null,
        language: language,
        isActive: true
      });
      await session.save();
    }

    // Save user message
    const userMessage = new ChatMessage({
      session: sessionId,
      user: req.user ? req.user._id : null,
      message: message,
      sender: 'user',
      language: language,
      timestamp: new Date()
    });
    await userMessage.save();

    // Process message and get response
    const response = await processChatMessage({
      message: message,
      sessionId: sessionId,
      language: language,
      context: session.context,
      user: req.user
    });

    // Save bot response
    const botMessage = new ChatMessage({
      session: sessionId,
      user: req.user ? req.user._id : null,
      message: response.message,
      sender: 'bot',
      language: language,
      intent: response.intent,
      entities: response.entities,
      suggestions: response.suggestions,
      timestamp: new Date()
    });
    await botMessage.save();

    // Update session context
    session.context = { ...session.context, ...response.context };
    session.lastActivity = new Date();
    await session.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: response.message,
        intent: response.intent,
        entities: response.entities,
        suggestions: response.suggestions,
        quickReplies: response.quickReplies,
        attachments: response.attachments
      }
    });
  } catch (error) {
    console.error('Process message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while processing message'
    });
  }
});

// @desc    Get chat history
// @route   GET /api/chatbot/history/:sessionId
// @access  Private (Optional)
router.get('/history/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found'
      });
    }

    // Check if user owns the session (if authenticated)
    if (req.user && session.user && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this chat session'
      });
    }

    const messages = await ChatMessage.find({ session: sessionId })
      .sort({ timestamp: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ChatMessage.countDocuments({ session: sessionId });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: {
        session: {
          id: session._id,
          language: session.language,
          isActive: session.isActive,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        },
        messages
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching chat history'
    });
  }
});

// @desc    End chat session
// @route   POST /api/chatbot/end-session/:sessionId
// @access  Private (Optional)
router.post('/end-session/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found'
      });
    }

    // Check if user owns the session (if authenticated)
    if (req.user && session.user && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to end this chat session'
      });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Chat session ended successfully'
    });
  } catch (error) {
    console.error('End chat session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while ending chat session'
    });
  }
});

// @desc    Get available languages
// @route   GET /api/chatbot/languages
// @access  Public
router.get('/languages', async (req, res) => {
  try {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
      { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
    ];

    res.status(200).json({
      status: 'success',
      data: { languages }
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching languages'
    });
  }
});

// @desc    Get chatbot capabilities
// @route   GET /api/chatbot/capabilities
// @access  Public
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      languages: ['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr'],
      features: [
        'Destination Information',
        'Itinerary Planning',
        'Booking Assistance',
        'Weather Updates',
        'Transport Information',
        'Local Recommendations',
        'Cultural Insights',
        'Emergency Help',
        'Language Translation',
        'Voice Messages'
      ],
      intents: [
        'greeting',
        'destination_info',
        'itinerary_planning',
        'booking',
        'weather',
        'transport',
        'food',
        'accommodation',
        'events',
        'emergency',
        'complaint',
        'feedback'
      ],
      supportedMedia: ['text', 'image', 'voice', 'location'],
      responseTime: '< 2 seconds',
      availability: '24/7'
    };

    res.status(200).json({
      status: 'success',
      data: { capabilities }
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching capabilities'
    });
  }
});

// @desc    Translate message
// @route   POST /api/chatbot/translate
// @access  Public
router.post('/translate', [
  body('text').trim().notEmpty().withMessage('Text is required'),
  body('targetLanguage').isIn(['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']).withMessage('Invalid target language'),
  body('sourceLanguage').optional().isIn(['en', 'hi', 'bn', 'or', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'as', 'ne', 'ur', 'mr']).withMessage('Invalid source language')
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

    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    const translatedText = await translateText(text, targetLanguage, sourceLanguage);

    res.status(200).json({
      status: 'success',
      data: {
        originalText: text,
        translatedText: translatedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage
      }
    });
  } catch (error) {
    console.error('Translate message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while translating message'
    });
  }
});

// @desc    Get chatbot analytics
// @route   GET /api/chatbot/analytics
// @access  Private (Admin only)
router.get('/analytics', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const match = {};
    
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await ChatSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          averageSessionDuration: { $avg: '$sessionDuration' },
          totalMessages: { $sum: '$messageCount' },
          languages: { $addToSet: '$language' }
        }
      }
    ]);

    const intentStats = await ChatMessage.aggregate([
      { $match: { sender: 'bot', ...match } },
      {
        $group: {
          _id: '$intent',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: analytics[0] || {
          totalSessions: 0,
          activeSessions: 0,
          averageSessionDuration: 0,
          totalMessages: 0,
          languages: []
        },
        intentStats
      }
    });
  } catch (error) {
    console.error('Get chatbot analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;
