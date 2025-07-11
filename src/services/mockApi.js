// Mock API service for search functionality
export const mockSearchAPI = async (query) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Generate mock data based on the query
  const mockResults = [];
  
  if (query.toLowerCase().includes('surfboard') || query.toLowerCase().includes('board')) {
    mockResults.push({
      type: "product",
      score: 0.85 + Math.random() * 0.15,
      productId: "surf-" + Math.random().toString(36).substr(2, 9),
      description: "High-quality surfboard perfect for beginners and intermediate surfers",
      category: "surfboard"
    });
  }
  
  if (query.toLowerCase().includes('longboard')) {
    mockResults.push({
      type: "product",
      score: 0.90 + Math.random() * 0.10,
      productId: "long-" + Math.random().toString(36).substr(2, 9),
      description: "Professional longboard designed for stability and smooth rides",
      category: "longboard"
    });
  }
  
  if (query.toLowerCase().includes('gift') || query.toLowerCase().includes('card')) {
    mockResults.push({
      type: "product",
      score: 0.75 + Math.random() * 0.20,
      productId: "gift-" + Math.random().toString(36).substr(2, 9),
      description: "This is a gift card for the store",
      category: "giftcard"
    });
  }

  // If no specific matches, generate generic results
  if (mockResults.length === 0) {
    const categories = ['surfboard', 'longboard', 'giftcard', 'accessory'];
    const descriptions = [
      'Premium quality product for water sports enthusiasts',
      'Professional grade equipment for serious athletes',
      'Perfect gift for surf lovers',
      'Essential accessory for your surfing needs'
    ];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      mockResults.push({
        type: "product",
        score: 0.3 + Math.random() * 0.6,
        productId: "prod-" + Math.random().toString(36).substr(2, 9),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category: categories[Math.floor(Math.random() * categories.length)]
      });
    }
  }

  // Return mock response matching the provided API structure
  return {
    event: "search-result",
    jobId: "mock-" + Math.random().toString(36).substr(2, 9),
    sessionId: "session-" + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    data: {
      duration: Math.floor(Math.random() * 2000) + 500,
      request: query,
      response: {
        widgets: mockResults,
        accuracy: mockResults.length > 0 ? "high" : "low",
        resultCount: mockResults.length,
        facets: {
          age_group: query.includes('3') ? "3 years" : "all ages",
          skill_level: query.includes('beginner') ? "starter" : "all levels",
          product_type: mockResults.map(r => r.category).join(', '),
          wave_height: query.includes('40') ? "40cm" : "various"
        },
        queryUsed: "strictQuery",
        resolvedQuery: query
      },
      meta: {
        jobId: "mock-" + Math.random().toString(36).substr(2, 9),
        sessionId: "session-" + Math.random().toString(36).substr(2, 9)
      },
      status: "ok"
    },
    status: "ok"
  };
}; 