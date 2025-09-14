const axios = require('axios');

// @desc    Analyze user sentiment from reviews and feedback
exports.analyzeUserSentiment = async (reviews) => {
  try {
    if (!reviews || reviews.length === 0) {
      return {
        overall: 'neutral',
        positive: 0,
        negative: 0,
        neutral: 0,
        confidence: 0,
        insights: []
      };
    }

    const sentimentResults = {
      positive: 0,
      negative: 0,
      neutral: 0,
      insights: [],
      keyPhrases: [],
      emotions: {
        joy: 0,
        anger: 0,
        fear: 0,
        sadness: 0,
        surprise: 0
      }
    };

    // Process each review for sentiment
    for (const review of reviews) {
      if (!review.review || review.review.trim() === '') continue;

      const sentiment = await analyzeSingleReview(review.review, review.rating);
      
      // Aggregate sentiment counts
      sentimentResults[sentiment.sentiment]++;
      
      // Collect insights
      if (sentiment.insights.length > 0) {
        sentimentResults.insights.push(...sentiment.insights);
      }
      
      // Collect key phrases
      if (sentiment.keyPhrases.length > 0) {
        sentimentResults.keyPhrases.push(...sentiment.keyPhrases);
      }
      
      // Aggregate emotions
      Object.keys(sentiment.emotions).forEach(emotion => {
        sentimentResults.emotions[emotion] += sentiment.emotions[emotion];
      });
    }

    // Calculate overall sentiment
    const total = sentimentResults.positive + sentimentResults.negative + sentimentResults.neutral;
    const overallSentiment = getOverallSentiment(sentimentResults, total);
    
    // Calculate confidence score
    const confidence = total > 0 ? Math.max(
      sentimentResults.positive / total,
      sentimentResults.negative / total,
      sentimentResults.neutral / total
    ) : 0;

    // Get top key phrases
    const topKeyPhrases = getTopKeyPhrases(sentimentResults.keyPhrases);

    return {
      overall: overallSentiment,
      positive: sentimentResults.positive,
      negative: sentimentResults.negative,
      neutral: sentimentResults.neutral,
      total: total,
      confidence: (confidence * 100).toFixed(2),
      insights: sentimentResults.insights.slice(0, 10), // Top 10 insights
      keyPhrases: topKeyPhrases,
      emotions: sentimentResults.emotions,
      distribution: {
        positive: total > 0 ? ((sentimentResults.positive / total) * 100).toFixed(2) : 0,
        negative: total > 0 ? ((sentimentResults.negative / total) * 100).toFixed(2) : 0,
        neutral: total > 0 ? ((sentimentResults.neutral / total) * 100).toFixed(2) : 0
      }
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      overall: 'neutral',
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0,
      confidence: 0,
      insights: ['Error analyzing sentiment'],
      keyPhrases: [],
      emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 },
      distribution: { positive: 0, negative: 0, neutral: 0 }
    };
  }
};

// @desc    Analyze single review for sentiment
const analyzeSingleReview = async (reviewText, rating) => {
  try {
    // Use OpenAI for sentiment analysis if API key is available
    if (process.env.OPENAI_API_KEY) {
      return await analyzeWithOpenAI(reviewText, rating);
    } else {
      // Fallback to rule-based sentiment analysis
      return analyzeWithRules(reviewText, rating);
    }
  } catch (error) {
    console.error('Single review analysis error:', error);
    return analyzeWithRules(reviewText, rating);
  }
};

// @desc    Analyze sentiment using OpenAI
const analyzeWithOpenAI = async (reviewText, rating) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis expert. Analyze the given review text and provide sentiment, key phrases, emotions, and insights in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this tourism review (rating: ${rating}/5): "${reviewText}". 
          
          Provide response in this JSON format:
          {
            "sentiment": "positive|negative|neutral",
            "keyPhrases": ["phrase1", "phrase2"],
            "emotions": {"joy": 0-1, "anger": 0-1, "fear": 0-1, "sadness": 0-1, "surprise": 0-1},
            "insights": ["insight1", "insight2"]
          }`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('OpenAI sentiment analysis error:', error);
    return analyzeWithRules(reviewText, rating);
  }
};

// @desc    Rule-based sentiment analysis fallback
const analyzeWithRules = (reviewText, rating) => {
  const text = reviewText.toLowerCase();
  
  // Sentiment keywords
  const positiveWords = [
    'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'good', 'beautiful',
    'awesome', 'perfect', 'love', 'enjoyed', 'recommend', 'best', 'outstanding',
    'spectacular', 'breathtaking', 'memorable', 'pleasant', 'delightful'
  ];
  
  const negativeWords = [
    'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointing', 'poor',
    'dirty', 'expensive', 'crowded', 'rude', 'slow', 'broken', 'uncomfortable',
    'overpriced', 'waste', 'avoid', 'regret', 'nightmare', 'disaster'
  ];

  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count positive and negative words
  positiveWords.forEach(word => {
    if (text.includes(word)) positiveScore++;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeScore++;
  });

  // Factor in rating
  if (rating >= 4) positiveScore += 2;
  else if (rating <= 2) negativeScore += 2;

  // Determine sentiment
  let sentiment = 'neutral';
  if (positiveScore > negativeScore) sentiment = 'positive';
  else if (negativeScore > positiveScore) sentiment = 'negative';

  // Extract key phrases (simplified)
  const keyPhrases = [];
  if (text.includes('staff') || text.includes('service')) keyPhrases.push('service quality');
  if (text.includes('clean') || text.includes('dirty')) keyPhrases.push('cleanliness');
  if (text.includes('price') || text.includes('cost') || text.includes('expensive')) keyPhrases.push('pricing');
  if (text.includes('food')) keyPhrases.push('food quality');
  if (text.includes('location')) keyPhrases.push('location');
  if (text.includes('view') || text.includes('scenery')) keyPhrases.push('scenic beauty');

  // Basic emotion detection
  const emotions = {
    joy: sentiment === 'positive' ? 0.7 : 0.2,
    anger: negativeScore > 2 ? 0.6 : 0.1,
    fear: text.includes('unsafe') || text.includes('dangerous') ? 0.5 : 0.1,
    sadness: sentiment === 'negative' ? 0.4 : 0.1,
    surprise: text.includes('unexpected') || text.includes('surprise') ? 0.6 : 0.2
  };

  // Generate insights
  const insights = [];
  if (positiveScore > 2) insights.push('Customer highly satisfied with experience');
  if (negativeScore > 2) insights.push('Customer experienced significant issues');
  if (keyPhrases.includes('service quality')) insights.push('Service quality mentioned');
  if (keyPhrases.includes('pricing')) insights.push('Pricing concerns raised');

  return {
    sentiment,
    keyPhrases,
    emotions,
    insights
  };
};

// @desc    Generate business insights from reviews
exports.generateInsights = async (reviews) => {
  try {
    const insights = {
      commonIssues: [],
      strengths: [],
      recommendations: [],
      trends: []
    };

    if (!reviews || reviews.length === 0) {
      return insights;
    }

    // Analyze common themes
    const themes = {
      service: 0,
      cleanliness: 0,
      pricing: 0,
      location: 0,
      food: 0,
      facilities: 0,
      staff: 0,
      accessibility: 0
    };

    const positiveThemes = {};
    const negativeThemes = {};

    reviews.forEach(review => {
      if (!review.review) return;
      
      const text = review.review.toLowerCase();
      const isPositive = review.rating >= 4;
      
      Object.keys(themes).forEach(theme => {
        if (text.includes(theme)) {
          themes[theme]++;
          if (isPositive) {
            positiveThemes[theme] = (positiveThemes[theme] || 0) + 1;
          } else {
            negativeThemes[theme] = (negativeThemes[theme] || 0) + 1;
          }
        }
      });
    });

    // Identify common issues (negative themes)
    Object.entries(negativeThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([theme, count]) => {
        insights.commonIssues.push({
          issue: theme,
          frequency: count,
          percentage: ((count / reviews.length) * 100).toFixed(1)
        });
      });

    // Identify strengths (positive themes)
    Object.entries(positiveThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([theme, count]) => {
        insights.strengths.push({
          strength: theme,
          frequency: count,
          percentage: ((count / reviews.length) * 100).toFixed(1)
        });
      });

    // Generate recommendations
    if (negativeThemes.service > 5) {
      insights.recommendations.push('Focus on improving customer service training');
    }
    if (negativeThemes.cleanliness > 3) {
      insights.recommendations.push('Implement stricter cleanliness standards');
    }
    if (negativeThemes.pricing > 4) {
      insights.recommendations.push('Review pricing strategy and value proposition');
    }
    if (negativeThemes.food > 3) {
      insights.recommendations.push('Enhance food quality and variety');
    }

    // Identify trends (simplified)
    const recentReviews = reviews.filter(r => 
      new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentReviews.length > 0) {
      const recentAvgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const overallAvgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      if (recentAvgRating > overallAvgRating + 0.5) {
        insights.trends.push('Recent improvement in customer satisfaction');
      } else if (recentAvgRating < overallAvgRating - 0.5) {
        insights.trends.push('Declining customer satisfaction trend');
      }
    }

    return insights;
  } catch (error) {
    console.error('Generate insights error:', error);
    return {
      commonIssues: [],
      strengths: [],
      recommendations: ['Error generating insights'],
      trends: []
    };
  }
};

// @desc    Get overall sentiment from aggregated results
const getOverallSentiment = (results, total) => {
  if (total === 0) return 'neutral';
  
  const positiveRatio = results.positive / total;
  const negativeRatio = results.negative / total;
  
  if (positiveRatio > 0.6) return 'positive';
  if (negativeRatio > 0.6) return 'negative';
  return 'neutral';
};

// @desc    Get top key phrases from frequency analysis
const getTopKeyPhrases = (phrases) => {
  const phraseCount = {};
  
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
  });
  
  return Object.entries(phraseCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
};

// @desc    Generate predictive analytics
exports.generatePredictiveAnalytics = async (historicalData) => {
  try {
    // Simple trend analysis and predictions
    const predictions = {
      userGrowth: predictUserGrowth(historicalData.users),
      revenueGrowth: predictRevenueGrowth(historicalData.revenue),
      seasonalTrends: analyzeSeasonalTrends(historicalData.bookings),
      riskFactors: identifyRiskFactors(historicalData)
    };

    return predictions;
  } catch (error) {
    console.error('Predictive analytics error:', error);
    return {
      userGrowth: { trend: 'stable', prediction: 0 },
      revenueGrowth: { trend: 'stable', prediction: 0 },
      seasonalTrends: [],
      riskFactors: []
    };
  }
};

// Helper functions for predictive analytics
const predictUserGrowth = (userData) => {
  if (!userData || userData.length < 2) {
    return { trend: 'insufficient_data', prediction: 0 };
  }

  const growthRates = [];
  for (let i = 1; i < userData.length; i++) {
    const rate = (userData[i].count - userData[i-1].count) / userData[i-1].count;
    growthRates.push(rate);
  }

  const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const trend = avgGrowthRate > 0.05 ? 'growing' : avgGrowthRate < -0.05 ? 'declining' : 'stable';

  return {
    trend,
    prediction: (avgGrowthRate * 100).toFixed(2),
    confidence: Math.min(userData.length / 10, 1)
  };
};

const predictRevenueGrowth = (revenueData) => {
  if (!revenueData || revenueData.length < 2) {
    return { trend: 'insufficient_data', prediction: 0 };
  }

  const growthRates = [];
  for (let i = 1; i < revenueData.length; i++) {
    const rate = (revenueData[i].revenue - revenueData[i-1].revenue) / revenueData[i-1].revenue;
    growthRates.push(rate);
  }

  const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const trend = avgGrowthRate > 0.1 ? 'growing' : avgGrowthRate < -0.1 ? 'declining' : 'stable';

  return {
    trend,
    prediction: (avgGrowthRate * 100).toFixed(2),
    nextMonthRevenue: revenueData[revenueData.length - 1].revenue * (1 + avgGrowthRate)
  };
};

const analyzeSeasonalTrends = (bookingData) => {
  const monthlyData = {};
  
  bookingData.forEach(booking => {
    const month = new Date(booking.date).getMonth();
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const trends = Object.entries(monthlyData)
    .map(([month, count]) => ({
      month: parseInt(month),
      bookings: count,
      season: getSeason(parseInt(month))
    }))
    .sort((a, b) => b.bookings - a.bookings);

  return trends;
};

const identifyRiskFactors = (data) => {
  const risks = [];
  
  // Check for declining trends
  if (data.users && data.users.length > 1) {
    const recent = data.users.slice(-3);
    const declining = recent.every((curr, i) => i === 0 || curr.count < recent[i-1].count);
    if (declining) risks.push('Declining user registration trend');
  }

  // Check cancellation rates
  if (data.bookings) {
    const totalBookings = data.bookings.length;
    const cancelled = data.bookings.filter(b => b.status === 'cancelled').length;
    const cancellationRate = cancelled / totalBookings;
    if (cancellationRate > 0.2) risks.push('High booking cancellation rate');
  }

  return risks;
};

const getSeason = (month) => {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Monsoon';
  return 'Winter';
};

module.exports = exports;
