const analyzeResponses = (responses) => {
  // Filter out null responses
  const validResponses = responses.filter(response => response !== null);
  
  if (validResponses.length === 0) {
    return null;
  }

  // Score each response based on multiple criteria
  const scoredResponses = validResponses.map(response => {
    let score = 0;
    const text = response.text.toLowerCase();

    // Length score (prefer detailed responses but not too long)
    const wordCount = text.split(' ').length;
    if (wordCount >= 100 && wordCount <= 500) score += 2;
    else if (wordCount > 500) score += 1;
    else if (wordCount < 50) score -= 1;

    // Information richness score
    const keyTerms = [
      'jharkhand', 'tourism', 'culture', 'festival', 'food', 'temple',
      'heritage', 'tradition', 'art', 'history', 'travel', 'location',
      'cuisine', 'accommodation', 'transport'
    ];
    score += keyTerms.filter(term => text.includes(term)).length * 0.5;

    // Structure score
    if (text.includes('\n')) score += 1; // Has formatting
    if (text.includes('•') || text.includes('-')) score += 1; // Has bullet points

    // Confidence score
    score += response.confidence * 2;

    return {
      ...response,
      score
    };
  });

  // Sort by score and return the best response
  scoredResponses.sort((a, b) => b.score - a.score);
  return scoredResponses[0];
};

module.exports = { analyzeResponses };