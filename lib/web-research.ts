/**
 * Web Research Service
 * 
 * Searches the web for real-time information about markets to inform betting decisions
 * Uses Google Custom Search API for actual web search
 */

export interface ResearchResult {
  title: string;
  snippet: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
}

/**
 * Generate search query for a market
 */
export function generateSearchQuery(
  marketQuestion: string,
  category?: string
): string {
  let searchQuery = marketQuestion;
  
  // Add category-specific terms for better results
  if (category === 'sports') {
    searchQuery += ' news updates recent analysis';
  } else if (category === 'politics') {
    searchQuery += ' latest news polls analysis';
  } else if (category === 'crypto') {
    searchQuery += ' cryptocurrency news price analysis trends';
  } else if (category === 'finance') {
    searchQuery += ' financial news economic data analysis';
  } else {
    searchQuery += ' latest news updates analysis';
  }
  
  return searchQuery;
}

/**
 * Search the web using Google Custom Search API
 */
async function searchGoogle(
  query: string,
  maxResults: number = 5
): Promise<ResearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    console.warn('⚠️ Google Custom Search API credentials not configured');
    return [];
  }
  
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', Math.min(maxResults, 10).toString()); // Google allows max 10 results per request
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Custom Search API error:', response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }
    
    // Transform Google results to our format
    const results: ResearchResult[] = data.items.map((item: any, index: number) => {
      // Determine relevance based on position and content
      let relevance: 'high' | 'medium' | 'low' = 'medium';
      if (index < 2) relevance = 'high';
      else if (index >= 4) relevance = 'low';
      
      return {
        title: item.title || '',
        snippet: item.snippet || '',
        url: item.link || '',
        relevance,
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error performing Google Custom Search:', error);
    return [];
  }
}

/**
 * Search the web for information relevant to a market
 * Uses Google Custom Search API if configured, otherwise returns empty array
 */
export async function researchMarket(
  marketQuestion: string,
  category?: string,
  maxResults: number = 5
): Promise<ResearchResult[]> {
  const searchQuery = generateSearchQuery(marketQuestion, category);
  
  // Perform actual web search using Google Custom Search API
  const results = await searchGoogle(searchQuery, maxResults);
  
  return results;
}

/**
 * Format research results for AI prompt
 */
export function formatResearchForPrompt(results: ResearchResult[]): string {
  if (results.length === 0) {
    return 'No recent web research available for this market.';
  }
  
  let formatted = `\n=== RECENT WEB RESEARCH ===\n`;
  formatted += `I've gathered ${results.length} recent information sources:\n\n`;
  
  results.forEach((result, index) => {
    formatted += `${index + 1}. ${result.title}\n`;
    formatted += `   ${result.snippet}\n`;
    formatted += `   Source: ${result.url}\n`;
    formatted += `   Relevance: ${result.relevance}\n\n`;
  });
  
  formatted += `Use this information to form a data-driven hypothesis about whether this is a good bet.\n`;
  formatted += `Consider: recent news, trends, expert opinions, and factual data.\n`;
  
  return formatted;
}

