/**
 * Web Research Service
 * 
 * Searches the web for real-time information about markets to inform betting decisions
 * 
 * Note: This service provides search query generation. Actual web search is performed
 * by the AI model when instructed, or can be implemented via search APIs (Google, Bing, etc.)
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
 * Search the web for information relevant to a market
 * Returns search query for AI to use
 */
export async function researchMarket(
  marketQuestion: string,
  category?: string,
  maxResults: number = 5
): Promise<ResearchResult[]> {
  // This function generates the search query
  // The actual web search will be performed by the AI model when instructed
  // or can be implemented via external search APIs
  
  const searchQuery = generateSearchQuery(marketQuestion, category);
  
  // Return empty array - the AI will be instructed to search using this query
  return [];
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

